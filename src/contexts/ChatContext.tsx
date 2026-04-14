import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { IMessage } from '@stomp/stompjs';
import { useUser } from './UserContext';
import { useStomp } from './StompContext';
import api from '../utils/api';

export interface ChatMessage {
  id?: number;
  type: 'TALK' | 'ENTER' | 'LEAVE' | 'QUIT';
  roomId: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp?: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  isLoadingHistory: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { client, isConnected } = useStomp(); // 통합 StompClient 가져오기
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 1. 이전 대화 내역 조회
  const fetchChatHistory = useCallback(async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const response = await api.get('/api/chat/getChatHistory/OPEN_CHAT');
      const history = Array.isArray(response.data) ? response.data : (response.data.list || []);
      setMessages(history);
      console.log('📜 [HISTORY] Loaded:', history.length, 'messages');
    } catch (error) {
      console.error('❌ [HISTORY] Failed to fetch:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  // 초기 히스토리 로드
  useEffect(() => {
    if (!user || !user.memberId) return;
    fetchChatHistory();
  }, [user, fetchChatHistory]);

  // 2. 실시간 메시지 발송 (TALK)
  const sendMessage = useCallback((content: string) => {
    if (!client || !isConnected || !user) {
      console.warn('⚠️ [SEND] WebSocket not connected');
      return;
    }

    const payload = {
      type: 'TALK',
      roomId: 'OPEN_CHAT',
      senderId: user.memberId,
      senderName: user.userName,
      content: content,
    };

    client.publish({
      destination: '/pub/chat/message',
      body: JSON.stringify(payload),
    });
    console.log('📤 [SEND] TALK Message sent:', content);
  }, [user, client, isConnected]);

  // 3. WebSocket 구독 설정
  useEffect(() => {
    if (!client || !isConnected || !user?.memberId) return;

    console.log('📡 [CHAT] Subscribing to /sub/chat/open for:', user.userName);
        
    const subscription = client.subscribe('/sub/chat/open', (message: IMessage) => {
      const newMessage: ChatMessage = JSON.parse(message.body);
      
      // 시스템 메시지 처리
      if (newMessage.type === 'QUIT' || newMessage.type === 'ENTER') {
        if (newMessage.type === 'ENTER' && newMessage.senderId === user.memberId) {
          console.log('🤫 My own ENTER message ignored');
          return;
        }
        
        console.log(`🔔 [SYSTEM EVENT] ${newMessage.type} received:`, newMessage.content);
        setMessages(prev => [...prev, newMessage]);
        return;
      }

      console.log('📥 [RECEIVE] Message from server:', newMessage);
      
      setMessages(prev => {
        // TALK 중복 방지
        const isDuplicate = prev.some(m => 
          m.type === newMessage.type && 
          m.senderId === newMessage.senderId && 
          m.content === newMessage.content &&
          (m.timestamp === newMessage.timestamp || !m.timestamp)
        );
        
        if (isDuplicate) {
          console.log('🚫 [RECEIVE] Duplicate ignored');
          return prev;
        }
        
        return [...prev, newMessage];
      });
    });

    // 입장 메시지 발송
    const timerId = setTimeout(() => {
      if (client.connected) {
        const enterPayload = {
          type: 'ENTER',
          roomId: 'OPEN_CHAT',
          senderId: user.memberId,
          senderName: user.userName,
          content: `${user.userName}님이 입장하셨습니다.`,
        };
        
        client.publish({
          destination: '/pub/chat/message',
          body: JSON.stringify(enterPayload),
        });
        console.log('📤 [SEND] ENTER Message published to server');
      }
    }, 800);

    return () => {
      console.log('🔌 [CHAT] Unsubscribing from chat');
      clearTimeout(timerId);
      subscription.unsubscribe();
    };
  }, [client, isConnected, user]);

  return (
    <ChatContext.Provider value={{ messages, sendMessage, isLoadingHistory }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
