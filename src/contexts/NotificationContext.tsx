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

      // 가이드 적용: 서버는 이제 안 읽음(IS_READ = 'N') 상태인 알림만 리턴함
      if (Array.isArray(resData)) {
        rawList = resData;
      } else if (resData && typeof resData === 'object') {
        rawList = resData.list || resData.data || resData.result || [];
      }

      const mappedList = rawList.map((item: any) => ({
        ...item,
        id: String(item.notiId || item.id || `hist_${Date.now()}`),
        content: item.content || item.message || item.notiContent || '새로운 알림이 있습니다.',
        timestamp: item.timestamp || item.createAt || item.createdAt || new Date().toLocaleString(),
        isRead: false // 서버에서 안 읽은 것만 오므로 기본 false
      }));

      setNotifications(mappedList);
      // 가이드 적용: 응답 데이터의 길이를 그대로 배지 숫자로 사용
      setUnreadCount(mappedList.length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user]);

  // 알림 읽음 처리
  const markAsRead = async (id: string) => {
    if (!user || !user.memberId) return;
    try {
      // 가이드 적용: PUT /api/notification/read/{notiId}
      await api.put(`/api/notification/read/${id}`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // 모두 읽음 처리 (가이드: 사용자가 알림 목록 창을 열었을 때 호출)
  const markAllAsRead = async () => {
    if (!user || !user.memberId) return;
    try {
      // 가이드 적용: PUT /api/notification/readAll/{receiverId}
      await api.put(`/api/notification/readAll/${user.memberId}`);
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
