import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api'; 
import { useAlert } from './AlertContext';

interface User {
  userId: string;
  userName: string;
  userRole: string;
  accessToken: string;
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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useAlert(); 
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

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
    try {
      const response = await api.post('/api/auth/token-refresh');
      const data = response.data;
      const rawData = data.result?.data || data.data || data.result || data;

      if (rawData && rawData.accessToken) {
        const newUser: User = {
          userId: rawData.userId,
          userName: rawData.userName,
          userRole: rawData.userRole,
          accessToken: rawData.accessToken,
          memberId: rawData.memberId,
          profileImage: rawData.profileImage,
          postCount: Number(rawData.postCount) || 0,
          commentCount: Number(rawData.commentCount) || 0,
          lastLogAt: rawData.lastLogAt,
          userStatus: rawData.userStatus,
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
      return false;
    }
  };

  useEffect(() => {
    if (isInitialized.current) return;

    const initializeUser = async () => {
      let storedUser = null;
      let isRemembered = false;

      try {
        isRemembered = localStorage.getItem('rememberMe') === 'true';
        storedUser = sessionStorage.getItem('user') || (isRemembered ? localStorage.getItem('user') : null);
      } catch (e) {
        console.warn('Initial storage access failed');
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse stored user data');
        }
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
            const newUser: User = {
              userId: rawData.userId || prev?.userId || '',
              userName: rawData.userName || prev?.userName || '',
              userRole: rawData.userRole || prev?.userRole || '',
              accessToken: rawData.accessToken,
              memberId: rawData.memberId || prev?.memberId || '',
              profileImage: rawData.profileImage || prev?.profileImage,
              postCount: rawData.postCount !== undefined ? Number(rawData.postCount) : (prev?.postCount || 0),
              commentCount: rawData.commentCount !== undefined ? Number(rawData.commentCount) : (prev?.commentCount || 0),
              lastLogAt: rawData.lastLogAt || prev?.lastLogAt,
              userStatus: rawData.userStatus || prev?.userStatus,
            };
            return newUser;
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
      // ❌ 로그인 시도 실패 시 clearUser()를 호출하면 인터셉터의 에러 처리와 충돌할 수 있으므로 제거
      console.error("Login process failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post('/api/auth/logout', null, {
        headers: {
          'Authorization': `Bearer ${user?.accessToken}`,
        }
      });
    } catch (error) {
      console.error('Logout API failed, but proceeding to clear local session.');
    } finally {
      clearUser(); 
      setIsLoading(false);
      window.location.href = '/';
    }
  }, [user?.accessToken, clearUser]);

  return (
    <UserContext.Provider value={{ user, login, logout, isLoading, clearUser, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error('useUser must be used within a UserProvider');
  return context;
};
