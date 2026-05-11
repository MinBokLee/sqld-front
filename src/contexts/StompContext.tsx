import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { useUser } from './UserContext';
import { isTokenExpired } from '../utils/api';

interface StompContextType {
  isConnected: boolean;
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
  subscribe: (destination: string, callback: (message: IMessage) => void, headers?: any) => () => void;
  publish: (destination: string, body: any) => void;
}

const StompContext = createContext<StompContextType | undefined>(undefined);

export const StompProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshSession } = useUser();
  const stompClientRef = useRef<Client | null>(null);
  const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const isConnected = status === 'CONNECTED';
  const connectingRef = useRef(false);

  // 구독 함수
  const subscribe = useCallback((destination: string, callback: (message: IMessage) => void, headers: any = {}) => {
    const client = stompClientRef.current;
    if (client && client.connected) {
      const token = user?.accessToken;
      if (isTokenExpired(token)) {
        console.warn('📡 [STOMP] Subscribe blocked: Token expired');
        return () => {};
      }

      const authHeaders = token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
      const subscription: StompSubscription = client.subscribe(destination, callback, authHeaders);
      
      return () => subscription.unsubscribe();
    }
    return () => {};
  }, [isConnected, user?.accessToken]);

  const publish = useCallback((destination: string, body: any) => {
    const client = stompClientRef.current;
    if (client && client.connected) {
      if (isTokenExpired(user?.accessToken)) {
        console.warn('📡 [STOMP] Publish blocked: Token expired');
        return;
      }

      client.publish({
        destination,
        body: JSON.stringify(body)
      });
    }
  }, [user?.accessToken]);

  useEffect(() => {
    const handleAuthError = () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setStatus('DISCONNECTED');
        connectingRef.current = false;
      }
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  useEffect(() => {
    const connectStomp = async () => {
      let currentToken = user?.accessToken;
      const memberId = user?.memberId;

      if (!memberId || !currentToken) {
        if (stompClientRef.current) {
          stompClientRef.current.deactivate();
          stompClientRef.current = null;
          setStatus('DISCONNECTED');
        }
        return;
      }

      // [기술 가이드 준수] 연결 전 토큰 만료 체크 및 자동 갱신
      if (isTokenExpired(currentToken)) {
        console.log('🔄 [STOMP] Token expired before connect. Attempting refresh...');
        const success = await refreshSession();
        if (!success) {
          console.error('❌ [STOMP] Token refresh failed. Aborting connection.');
          return;
        }
        // refreshSession 성공 시 user 객체가 업데이트되므로 다음 effect cycle에서 연결됨
        return;
      }

      if (connectingRef.current || stompClientRef.current?.active) return;

      connectingRef.current = true;
      setStatus('CONNECTING');

      const client = new Client({
        webSocketFactory: () => new SockJS('/ws-stomp'),
        connectHeaders: { Authorization: `Bearer ${currentToken}` },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('✅ [STOMP] Connected');
          setStatus('CONNECTED');
          connectingRef.current = false;
        },
        onDisconnect: () => {
          setStatus('DISCONNECTED');
          connectingRef.current = false;
        },
        onStompError: (frame) => {
          const errorMessage = frame.headers['message'] || '';
          if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('expired')) {
            console.warn('🔌 [STOMP] Auth Error. Deactivating and requesting refresh.');
            client.deactivate();
            refreshSession(); // 비동기로 갱신 요청
          }
          setStatus('DISCONNECTED');
          connectingRef.current = false;
        },
      });

      client.activate();
      stompClientRef.current = client;
    };

    connectStomp();

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      setStatus('DISCONNECTED');
      connectingRef.current = false;
    };
  }, [user?.accessToken, user?.memberId, refreshSession]);

  return (
    <StompContext.Provider value={{ isConnected, status, subscribe, publish }}>
      {children}
    </StompContext.Provider>
  );
};

export const useStomp = () => {
  const context = useContext(StompContext);
  if (!context) throw new Error('useStomp must be used within a StompProvider');
  return context;
};
