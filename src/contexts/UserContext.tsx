import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import api from '../utils/api'; 
import { useAlert } from './AlertContext';
import ConfirmModal from '../components/ConfirmModal';

interface User {
  userId: string;
  userName: string;
  userRole: string;
  accessToken: string;
  refreshToken: string;
  memberId: string;
  profileImage?: string; 
  postCount?: number;
  commentCount?: number;
  lastLogAt?: string;
  userStatus?: string; 
}

interface UserContextType {
  user: User | null;
  login: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  clearUser: () => void; 
  updateUser: (data: Partial<User>) => void; 
  refreshSession: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const IDLE_THRESHOLD = 29 * 60 * 1000; // 29분 후 경고 모달 표시
const WARNING_DURATION = 60; // 60초간 대기

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useAlert(); 
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  // --- 모달 상태 추가 ---
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_DURATION);
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearUser = useCallback(() => {
    setUser(null);
    try {
      sessionStorage.removeItem('user');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
    } catch (e) {
      console.warn('Storage access failed during clearUser');
    }
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      try {
        const isRemembered = localStorage.getItem('rememberMe') === 'true';
        if (isRemembered) {
          localStorage.setItem('user', JSON.stringify(updated));
        } else {
          sessionStorage.setItem('user', JSON.stringify(updated));
        }
      } catch (e) {
        console.warn('Storage access failed during updateUser');
      }
      return updated;
    });
  }, []);

  const refreshSession = async () => {
    const storedUserStr = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (!storedUserStr) return false;

    try {
      const storedUser = JSON.parse(storedUserStr);
      const response = await axios.post('/api/sign/reissue', {
        refreshToken: storedUser.refreshToken,
        memberId: storedUser.memberId
      }, { withCredentials: true });
      
      const rawData = response.data?.data || response.data;

      if (rawData && rawData.accessToken) {
        const newUser: User = {
          ...storedUser,
          accessToken: rawData.accessToken,
          refreshToken: rawData.refreshToken || storedUser.refreshToken
        };
        setUser(newUser);
        
        const isRemembered = localStorage.getItem('rememberMe') === 'true';
        try {
          if (isRemembered) {
            localStorage.setItem('user', JSON.stringify(newUser));
          } else {
            sessionStorage.setItem('user', JSON.stringify(newUser));
          }
        } catch (e) {
          console.warn('Storage access failed during refreshSession');
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  };

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post('/api/auth/logout', null, {
        headers: { 'Authorization': `Bearer ${user?.accessToken}` }
      });
    } catch (error) {
      console.error('Logout API failed');
    } finally {
      clearUser(); 
      setIsLoading(false);
      window.location.href = '/';
    }
  }, [user?.accessToken, clearUser]);

  // 자동 로그아웃 (사유: 유휴 상태)
  const handleIdleLogout = useCallback(() => {
    setIsWarningModalOpen(false);
    localStorage.setItem('idle_logout_occurred', 'true'); // 표식 남기기
    logout();
  }, [logout]);

  // 세션 연장 처리
  const handleExtendSession = async () => {
    const success = await refreshSession();
    if (success) {
      setIsWarningModalOpen(false);
      setCountdown(WARNING_DURATION);
      showToast("로그인 시간이 연장되었습니다. ✅", 'success');
    } else {
      handleIdleLogout();
    }
  };

  // --- 유휴 상태 감지 로직 ---
  useEffect(() => {
    if (!user) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const resetIdleTimer = () => {
      if (isWarningModalOpen) return; // 경고창이 떠있을 때는 활동 감지로 리셋하지 않음 (명시적 클릭 유도)
      
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsWarningModalOpen(true);
      }, IDLE_THRESHOLD);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(name => window.addEventListener(name, resetIdleTimer));
    
    resetIdleTimer();

    return () => {
      events.forEach(name => window.removeEventListener(name, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, isWarningModalOpen]);

  // --- 경고창 카운트다운 로직 ---
  useEffect(() => {
    if (isWarningModalOpen) {
      setCountdown(WARNING_DURATION);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            handleIdleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isWarningModalOpen, handleIdleLogout]);

  // --- 초기화 로직 (로그아웃 표식 확인 포함) ---
  useEffect(() => {
    if (isInitialized.current) return;

    const initializeUser = async () => {
      // 1. 유휴 로그아웃 표식 확인
      if (localStorage.getItem('idle_logout_occurred') === 'true') {
        setIsInfoModalOpen(true);
        localStorage.removeItem('idle_logout_occurred');
      }

      let storedUser = null;
      let isRemembered = false;

      try {
        isRemembered = localStorage.getItem('rememberMe') === 'true';
        storedUser = sessionStorage.getItem('user') || (isRemembered ? localStorage.getItem('user') : null);
      } catch (e) { console.warn('Storage error'); }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) { console.error('Parse error'); }
      } else if (isRemembered) {
        const success = await refreshSession();
        if (!success) clearUser();
      }
      setIsLoading(false);
      isInitialized.current = true;
    };

    const handleRefreshed = (e: any) => {
      if (e.detail) {
        const rawData = e.detail;
        setUser(prev => {
          if (prev?.accessToken !== rawData.accessToken) {
            return {
              ...prev,
              ...rawData,
              accessToken: rawData.accessToken,
              refreshToken: rawData.refreshToken || prev?.refreshToken || ''
            } as User;
          }
          return prev;
        });
      }
    };

    const handleAuthError = () => {
      clearUser();
    };

    window.addEventListener('auth-token-refreshed', handleRefreshed);
    window.addEventListener('auth-error', handleAuthError);
    initializeUser();

    return () => {
      window.removeEventListener('auth-token-refreshed', handleRefreshed);
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, [clearUser]);

  const login = useCallback(async (username: string, password: string, rememberMe: boolean): Promise<boolean> => {
    setIsLoading(true);
    try {
      const rawData = await api.post('/api/auth/signIn', { 
        userId: username, 
        userPass: password 
      });

      if (rawData) {
        const newUser: User = {
          userId: rawData.userId,
          userName: rawData.userName,
          userRole: rawData.userRole,
          accessToken: rawData.accessToken,
          refreshToken: rawData.refreshToken,
          memberId: rawData.memberId,
          profileImage: rawData.profileImage,
          postCount: Number(rawData.postCount) || 0,
          commentCount: Number(rawData.commentCount) || 0,
          lastLogAt: rawData.lastLogAt,
          userStatus: rawData.userStatus,
        };

        setUser(newUser);
        try {
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('user', JSON.stringify(newUser));
            sessionStorage.removeItem('user');
          } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('user');
            sessionStorage.setItem('user', JSON.stringify(newUser));
          }
        } catch (e) {
          console.warn('Storage access failed during login save');
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Login process failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout, isLoading, clearUser, updateUser, refreshSession }}>
      {children}
      
      {/* 1. 세션 만료 예고 모달 */}
      <ConfirmModal 
        isOpen={isWarningModalOpen}
        title="로그인 연장 안내"
        message={`장시간 활동이 감지되지 않았습니다.\n보안을 위해 ${countdown}초 후 자동으로 로그아웃됩니다.\n\n로그인 상태를 연장하시겠습니까?`}
        confirmText="연장하기"
        cancelText="로그아웃"
        type="warning"
        onConfirm={handleExtendSession}
        onClose={handleIdleLogout}
      />

      {/* 2. 사후 자동 로그아웃 안내 모달 */}
      <ConfirmModal 
        isOpen={isInfoModalOpen}
        title="자동 로그아웃 안내"
        message="보안을 위해 장시간 미활동 사용자를 자동으로 로그아웃 처리하였습니다."
        confirmText="확인"
        cancelText="닫기"
        type="info"
        onConfirm={() => setIsInfoModalOpen(false)}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error('useUser must be used within a UserProvider');
  return context;
};
