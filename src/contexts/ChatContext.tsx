import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { IMessage } from '@stomp/stompjs';
import { useUser } from './UserContext';
import { useStomp } from './StompContext';

export interface ChatMessage {
  id?: number | string;
  type: 'TALK' | 'ENTER' | 'LEAVE' | 'QUIT';
  roomId: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp?: string;
  messageId?: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  isLoadingHistory: boolean;
  clearMessages: () => void;
  isConnected: boolean;
  connectedUsers: string[];
  userCount: number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { isConnected, subscribe, publish } = useStomp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [userCount, setUserCount] = useState<number>(0);
  const [isLoadingHistory] = useState(false);
  const subscribedRef = useRef<string | null>(null);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConnectedUsers([]);
    setUserCount(0);
  }, []);

  useEffect(() => {
    if (!user?.memberId) {
      clearMessages();
      subscribedRef.current = null;
    }
  }, [user?.memberId, clearMessages]);

  const sendMessage = useCallback((content: string) => {
    if (!isConnected || !user) return;
    const payload = {
      type: 'TALK',
      roomId: 'OPEN_CHAT',
      senderId: user.memberId,
      content: content.trim(),
    };
    publish('/pub/chat/message', payload);
  }, [user, isConnected, publish]);

  useEffect(() => {
    if (!isConnected || !user?.memberId || subscribedRef.current === user.memberId) return;
    
    subscribedRef.current = user.memberId;

    // 1. 메시지 구독
    const unsubscribeChat = subscribe('/sub/chat/room/OPEN_CHAT', (message: IMessage) => {
      try {
        const res = JSON.parse(message.body);
        const data: ChatMessage = res.data; 
        if (!data) return;

        const newMessage: ChatMessage = {
          ...data,
          messageId: data.id ? String(data.id) : `rt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        };

        if (newMessage.type === 'ENTER' && newMessage.senderId === user.memberId) return;

        setMessages(prev => {
          const isDup = prev.some(m => {
            if (newMessage.id && m.id) return String(m.id) === String(newMessage.id);
            return m.senderId === newMessage.senderId && m.content === newMessage.content &&
                   Math.abs(new Date(m.timestamp || 0).getTime() - new Date(newMessage.timestamp || 0).getTime()) < 1000;
          });
          return isDup ? prev : [...prev, newMessage];
        });
      } catch (e) {
        console.error('❌ [CHAT] Msg Error:', e);
      }
    });

    // 2. 접속자 명단 실시간 구독
    const unsubscribePresence = subscribe('/sub/chat/room/OPEN_CHAT/presence', (message: IMessage) => {
      try {
        const res = JSON.parse(message.body);
        console.log('👥 [CHAT] Presence Received:', res);
        
        // 로그 분석 결과: res.result.data 또는 res.data 구조 대응
        const presenceData = res.result?.data || res.data;

        if (res.success && presenceData) {
          const { userList, userCount } = presenceData;
          console.log(`✅ [CHAT] Sync Presence: ${userCount} users`, userList);
          setConnectedUsers(Array.isArray(userList) ? userList : []);
          setUserCount(Number(userCount) || 0);
        }
      } catch (e) {
        console.error('❌ [CHAT] Presence Parse Error:', e);
      }
    });

    // 입장 알림 발송 (0.5초 뒤 발송하여 구독 안착 시간 확보)
    const timerId = setTimeout(() => {
      publish('/pub/chat/message', {
        type: 'ENTER',
        roomId: 'OPEN_CHAT',
        senderId: user.memberId,
        content: `${user.userName}님이 입장하셨습니다.`,
      });
    }, 500);

    return () => {
      unsubscribeChat();
      unsubscribePresence();
      subscribedRef.current = null;
      clearTimeout(timerId);
    };
  }, [isConnected, user?.memberId, user?.userName, subscribe, publish]);

  return (
    <ChatContext.Provider value={{ 
      messages, 
      sendMessage, 
      isLoadingHistory, 
      clearMessages, 
      isConnected,
      connectedUsers,
      userCount
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
