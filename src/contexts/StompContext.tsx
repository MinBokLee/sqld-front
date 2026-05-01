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
  const { user } = useUser();
  const stompClientRef = useRef<Client | null>(null);
  const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const isConnected = status === 'CONNECTED';
  const connectingRef = useRef(false);

  // 구독 함수: 중복 방지를 위해 로그를 강화하고 인스턴스 존재 여부를 체크
  const subscribe = useCallback((destination: string, callback: (message: IMessage) => void, headers: any = {}) => {
    const client = stompClientRef.current;
    if (client && client.connected) {
      const token = user?.accessToken;
      // [사전검증] 토큰 만료 시 구독 시도 차단
      if (isTokenExpired(token)) {
        console.warn('📡 [STOMP] Subscribe blocked: Token expired');
        return () => {};
      }

      const authHeaders = token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
      
      console.log(`📡 [STOMP] >>> SUBSCRIBE Request to: ${destination}`);
      const subscription: StompSubscription = client.subscribe(destination, callback, authHeaders);
      
      return () => {
        console.log(`🔌 [STOMP] <<< UNSUBSCRIBE from: ${destination}`);
        subscription.unsubscribe();
      };
    }
    return () => {};
  }, [isConnected, user?.accessToken]);

  const publish = useCallback((destination: string, body: any) => {
    const client = stompClientRef.current;
    if (client && client.connected) {
      // [사전검증] 토큰 만료 시 발행 차단
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

  // [전략 3] 전역 인증 실패 이벤트 발생 시 연결 즉시 차단
  useEffect(() => {
    const handleAuthError = () => {
      if (stompClientRef.current) {
        console.log('🔌 [STOMP] Auth Error detected, forcing deactivation...');
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
    const token = user?.accessToken;
    const memberId = user?.memberId;

    if (!memberId || !token || isTokenExpired(token)) {
      if (stompClientRef.current) {
        console.log('🔌 [STOMP] No session or expired token, deactivating...');
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setStatus('DISCONNECTED');
      }
      return;
    }

    if (connectingRef.current || stompClientRef.current?.active) return;

    connectingRef.current = true;
    setStatus('CONNECTING');
    console.log('📡 [STOMP] Initiating connection for:', memberId);

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-stomp'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.log('🛠️ [STOMP Debug]', str),
      onConnect: () => {
        console.log('✅ [STOMP] Protocol Connected');
        setStatus('CONNECTED');
        connectingRef.current = false;
      },
      onDisconnect: () => {
        console.log('🔌 [STOMP] Protocol Disconnected');
        setStatus('DISCONNECTED');
        connectingRef.current = false;
      },
      onStompError: (frame) => {
        const errorMessage = frame.headers['message'] || '';
        console.error('❌ [STOMP] Error:', errorMessage);
        
        // [전략 2] 인증 에러(401/Expired)인 경우 자동 재연결 중단
        if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('expired')) {
          console.warn('🔌 [STOMP] Fatal Auth Error. Stopping auto-reconnect.');
          client.deactivate();
          if (stompClientRef.current === client) {
            stompClientRef.current = null;
          }
        }
        
        setStatus('DISCONNECTED');
        connectingRef.current = false;
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      console.log('🔌 [STOMP] Cleanup: Finalizing instance');
      client.deactivate();
      if (stompClientRef.current === client) {
        stompClientRef.current = null;
      }
      setStatus('DISCONNECTED');
      connectingRef.current = false;
    };
  }, [user?.accessToken, user?.memberId]);

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
