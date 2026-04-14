import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useUser } from './UserContext';

interface StompContextType {
  client: Client | null;
  isConnected: boolean;
}

const StompContext = createContext<StompContextType>({ client: null, isConnected: false });

export const StompProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const stompClientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = user?.accessToken || localStorage.getItem('token');

    // 유효한 사용자 정보나 토큰이 없으면 기존 연결 종료
    if (!user || !user.memberId || !token) {
      if (stompClientRef.current) {
        console.log('🔌 [STOMP] Deactivating main connection due to missing auth.');
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // 이미 연결이 존재하거나 활성화 중이면 중복 실행 방지
    if (stompClientRef.current && (stompClientRef.current.connected || stompClientRef.current.active)) {
      return;
    }

    console.log('🚀 [STOMP] Initializing MAIN unified connection for:', user.userName);

    const socketUrl = import.meta.env.VITE_API_BASE_URL 
      ? `${import.meta.env.VITE_API_BASE_URL}/ws-stomp` 
      : '/ws-stomp';

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log('✅ [STOMP] MAIN WebSocket Connected Successfully.', frame.headers['user-name'] || '');
        setIsConnected(true);
      },
      onDisconnect: () => {
        console.log('⚠️ [STOMP] MAIN WebSocket Disconnected.');
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('❌ [STOMP] Main Broker Error:', frame.headers['message']);
        setIsConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;

    // 클린업 함수: 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (stompClientRef.current) {
        console.log('🧹 [STOMP] Cleaning up main connection.');
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user]); // user가 변경될 때만 재실행됨

  return (
    <StompContext.Provider value={{ client: stompClientRef.current, isConnected }}>
      {children}
    </StompContext.Provider>
  );
};

export const useStomp = () => useContext(StompContext);
