import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { IMessage } from '@stomp/stompjs';
import { useUser } from './UserContext';
import { useAlert } from './AlertContext';
import { useStomp } from './StompContext';
import api from '../utils/api';

interface Notification {
  id: string; // 내부 관리를 위한 ID (notiId를 여기에 매핑)
  notiId?: number | string; // 백엔드 고유 ID
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
  const { client, isConnected } = useStomp(); // 통합 StompClient 가져오기
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 알림 목록 가져오기
  const fetchNotifications = useCallback(async () => {
    if (!user || !user.memberId) return;
    try {
      const response = await api.get(`/api/notification/list/${user.memberId}`);
      const rawList = response.data.list || response.data.result?.data?.list || [];
      const mappedList = rawList.map((item: any) => ({
        ...item,
        id: String(item.notiId || item.id || `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`),
        isRead: item.isRead === true || item.readStatus === 'Y'
      }));

      setNotifications(mappedList);
      setUnreadCount(response.data.unreadCount || response.data.result?.data?.unreadCount || 0);
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
    if (!user || !user.memberId) return;
    fetchNotifications();
  }, [user, fetchNotifications]);

  // WebSocket 구독 설정 (통합 client가 활성화되었을 때만 실행)
  useEffect(() => {
    if (!client || !isConnected || !user?.memberId) return;

    console.log('📡 [NOTI] Subscribing to:', `/sub/user/${user.memberId}`);
    
    const subscription = client.subscribe(`/sub/user/${user.memberId}`, (message: IMessage) => {
      console.log('🔔 [NOTI] Received (Raw):', message.body);
      
      try {
        const rawData = JSON.parse(message.body);
        
        const actualId = rawData.notiId || rawData.id;
        const newNoti: Notification = {
          ...rawData,
          id: actualId ? String(actualId) : `noti_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          notiId: rawData.notiId,
          isRead: false,
          timestamp: rawData.timestamp || new Date().toLocaleString()
        };

        setNotifications(prev => [newNoti, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        const displayContent = newNoti.content || '새로운 댓글 알림이 도착했습니다.';
        showToast(displayContent, 'info');
      } catch (e) {
        console.error('❌ [NOTI] Failed to parse notification:', e);
      }
    });

    // 클린업 함수: 컴포넌트 언마운트 또는 재실행 시 기존 구독 해제
    return () => {
      console.log('🔌 [NOTI] Unsubscribing from notifications');
      subscription.unsubscribe();
    };
  }, [client, isConnected, user, showToast]);

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
