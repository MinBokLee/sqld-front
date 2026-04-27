import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { IMessage } from '@stomp/stompjs';
import { useUser } from './UserContext';
import { useStomp } from './StompContext';
import api from '../utils/api';

export interface ChatMessage {
  id?: number | string;
  type: 'TALK' | 'ENTER' | 'LEAVE' | 'QUIT';
  roomId: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp?: string;
  messageId?: string; // [추가] 렌더링 키 충돌 방지용
}

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  isLoadingHistory: boolean;
  clearMessages: () => void;
  isConnected: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { isConnected, subscribe, publish } = useStomp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const subscribedRef = useRef<string | null>(null);

  const clearMessages = useCallback(() => {
    console.log('🧹 [CHAT] Force clearing state');
    setMessages([]);
  }, []);

  const fetchChatHistory = useCallback(async () => {
    if (!user?.memberId) return;
    setIsLoadingHistory(true);
    try {
      const history = await api.get('/api/chat/getChatHistory/OPEN_CHAT');
      const validHistory = Array.isArray(history) ? history : [];
      
      // 히스토리 데이터에도 고유 messageId 부여 (충돌 방지)
      const mappedHistory = validHistory.map((msg, idx) => ({
        ...msg,
        messageId: msg.id ? String(msg.id) : `hist-${idx}-${Date.now()}`
      }));

      setMessages(prev => {
        const combined = [...mappedHistory];
        prev.forEach(rt => {
          const exists = combined.some(h => 
            (h.id && rt.id && String(h.id) === String(rt.id)) ||
            (h.senderId === rt.senderId && h.content === rt.content && h.timestamp === rt.timestamp)
          );
          if (!exists) combined.push(rt);
        });
        return combined.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
      });
    } catch (error) {
      console.error('❌ [CHAT] History failed:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.memberId]);

  useEffect(() => {
    if (!user?.memberId) {
      clearMessages();
      subscribedRef.current = null;
    } else {
      // 휘발성 채팅 정책에 따라 이전 채팅 히스토리를 불러오지 않음
      // fetchChatHistory();
    }
  }, [user?.memberId, fetchChatHistory, clearMessages]);

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

    const unsubscribe = subscribe('/sub/chat/room/OPEN_CHAT', (message: IMessage) => {
      try {
        const res = JSON.parse(message.body);
        const data: ChatMessage = res.data; 
        
        if (!data) return;

        // 실시간 메시지에 고유 식별자 부여 (Key 충돌 방지)
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
        console.error('❌ [CHAT] Receive Error:', e);
      }
    });

    const timerId = setTimeout(() => {
      publish('/pub/chat/message', {
        type: 'ENTER',
        roomId: 'OPEN_CHAT',
        senderId: user.memberId,
        content: `${user.userName}님이 입장하셨습니다.`,
      });
    }, 1000);

    return () => {
      unsubscribe();
      subscribedRef.current = null;
      clearTimeout(timerId);
    };
  }, [isConnected, user?.memberId, user?.userName, subscribe, publish]);

  return (
    <ChatContext.Provider value={{ messages, sendMessage, isLoadingHistory, clearMessages, isConnected }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
