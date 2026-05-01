import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { IMessage } from '@stomp/stompjs';
import { useUser } from './UserContext';
import { useAlert } from './AlertContext';
import { useStomp } from './StompContext';
import api from '../utils/api';

interface Notification {
  id: string; 
  notiId?: number | string; 
  type: string;
  senderId: string;
  targetId: string;
  content: string;
  targetUrl: string;
  timestamp: string;
  isRead: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { showToast } = useAlert();
  const { isConnected, subscribe } = useStomp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 알림 목록 가져오기
  const fetchNotifications = useCallback(async () => {
    if (!user || !user.memberId) return;
    try {
      const resData: any = await api.get(`/api/notification/list/${user.memberId}`);
      let rawList: any[] = [];
      let unread = 0;

      if (Array.isArray(resData)) {
        rawList = resData;
      } else if (resData && typeof resData === 'object') {
        rawList = resData.list || resData.data || resData.result || [];
        unread = resData.unreadCount || resData.unread_count || 0;
      }

      const mappedList = rawList.map((item: any) => ({
        ...item,
        id: String(item.notiId || item.id || `hist_${Date.now()}`),
        // Map content flexibly
        content: item.content || item.message || item.notiContent || '새로운 알림이 있습니다.',
        // Map timestamp flexibly
        timestamp: item.timestamp || item.createAt || item.createdAt || new Date().toLocaleString(),
        isRead: item.isRead === true || item.readStatus === 'Y'
      }));

      setNotifications(mappedList);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user]);

  // 알림 읽음 처리
  const markAsRead = async (id: string) => {
    try {
      await api.put(`/api/notification/read/${id}`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // 모두 읽음 처리
  const markAllAsRead = async () => {
    try {
      await api.put('/api/notification/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // 초기 알림 히스토리 로드
  useEffect(() => {
    if (!user || !user.memberId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
  }, [user, fetchNotifications]);

  // WebSocket 구독 설정
  useEffect(() => {
    if (!isConnected || !user?.memberId) return;

    const topic = `/sub/user/${user.memberId}`;
    console.log(`📡 [NOTI] Subscribing to: ${topic}`);
    
    const unsubscribe = subscribe(topic, (message: IMessage) => {
      try {
        const response = JSON.parse(message.body);
        // response.data가 있으면 사용하고, 없으면 response 자체를 데이터로 사용
        const rawData = response.data || response;
        
        if (!rawData || (typeof rawData === 'object' && Object.keys(rawData).length === 0)) return;

        const actualId = rawData.notiId || rawData.id;
        const newNoti: Notification = {
          ...rawData,
          id: actualId ? String(actualId) : `noti_${Date.now()}`,
          notiId: rawData.notiId,
          content: rawData.content || rawData.message || rawData.notiContent || '새로운 알림이 도착했습니다.',
          isRead: false,
          timestamp: rawData.timestamp || rawData.createAt || new Date().toLocaleString()
        };

        setNotifications(prev => [newNoti, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        const displayContent = newNoti.content || '새로운 알림이 도착했습니다.';
        showToast(displayContent, 'info');
      } catch (e) {
        console.error('❌ [NOTI] Parse error:', e);
      }
    });

    return () => {
      console.log('🔌 [NOTI] Unsubscribing');
      unsubscribe();
    };
  }, [isConnected, user, subscribe, showToast]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      fetchNotifications, 
      markAsRead, 
      markAllAsRead 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
