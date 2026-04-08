import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { useUser } from './UserContext';
import { useAlert } from './AlertContext';
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const stompClientRef = useRef<Client | null>(null);

  // 알림 목록 가져오기
  const fetchNotifications = useCallback(async () => {
    if (!user || !user.memberId) return;
    try {
      // 가이드: GET /api/notification/list/{receiverId}
      const response = await api.get(`/api/notification/list/${user.memberId}`);

      // 서버 응답에서 리스트 추출 및 데이터 정규화 (notiId -> id 매핑)
      const rawList = response.data.list || response.data.result?.data?.list || [];
      const mappedList = rawList.map((item: any) => ({
        ...item,
        // UI 컴포넌트들이 사용하는 id 필드에 서버의 고유 ID인 notiId를 매핑
        id: String(item.notiId || item.id || `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`),
        isRead: item.isRead === true || item.readStatus === 'Y' // 읽음 상태 정규화
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
      // 가이드: PUT /api/notification/read/{notiId}
      await api.put(`/api/notification/read/${id}`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // 모두 읽음 처리 (가이드에 명시되지 않았으나 기존 로직 유지 시 단수형 경로로 수정)
  const markAllAsRead = async () => {
    try {
      await api.put('/api/notification/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // WebSocket 연결 설정
  useEffect(() => {
    // user 객체 내의 accessToken을 우선 사용
    const token = user?.accessToken || localStorage.getItem('token');
    
    // 디버깅 로그 추가
    console.log('🔍 NotificationProvider useEffect triggered');
    console.log('👤 Current User:', user);
    console.log('🆔 User memberId:', user?.memberId);
    console.log('🔑 Token exists (from user or storage):', !!token);

    if (!user || !user.memberId || !token) {
      console.log('⚠️ Connection condition NOT met. Returning early.');
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      return;
    }

    // 초기 알림 로드
    fetchNotifications();

    const socketUrl = import.meta.env.VITE_API_BASE_URL 
      ? `${import.meta.env.VITE_API_BASE_URL}/ws-stomp` 
      : '/ws-stomp';

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: {
        // 가이드: Authorization 헤더에 Bearer {JWT_TOKEN} 포함
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('📡 STOMP Debug:', str);
      },
      onWebSocketError: (error) => {
        console.error('❌ WebSocket Error:', error);
      },
      onWebSocketClose: (closeEvent) => {
        console.warn('⚠️ WebSocket Closed:', closeEvent);
      },
      onConnect: (frame) => {
        console.log('✅ WebSocket Connected. Frame:', frame);
        console.log('📡 Subscribing to:', `/sub/user/${user.memberId}`);
        
        // 내 전용 알림 채널 구독 (가이드: /sub/user/{memberId})
        client.subscribe(`/sub/user/${user.memberId}`, (message: IMessage) => {
          console.log('🔔 Notification Received (Raw):', message.body);
          
          try {
            const rawData = JSON.parse(message.body);
            console.log('📦 Parsed Notification:', rawData);
            
            // 데이터 정규화: 서버에서 준 notiId를 id로 사용
            const actualId = rawData.notiId || rawData.id;
            const newNoti: Notification = {
              ...rawData,
              id: actualId ? String(actualId) : `noti_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              notiId: rawData.notiId,
              isRead: false,
              timestamp: rawData.timestamp || new Date().toLocaleString()
            };

            // 알림 수신 시 상태 업데이트 및 토스트 표시
            setNotifications(prev => [newNoti, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            const displayContent = newNoti.content || '새로운 댓글 알림이 도착했습니다.';
            showToast(displayContent, 'info');
          } catch (e) {
            console.error('❌ Failed to parse notification message:', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [user, fetchNotifications, showToast]);

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
