import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import api from '../utils/api'; // Axios 인스턴스 임입

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearUser = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      sessionStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshSession = async () => {
    try {
      const response = await api.post('/api/token-refresh');
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
        sessionStorage.setItem('user', JSON.stringify(newUser));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const initializeUser = async () => {
      const storedUser = sessionStorage.getItem('user');
      const isRemembered = localStorage.getItem('rememberMe') === 'true';

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else if (isRemembered) {
        const success = await refreshSession();
        if (!success) clearUser();
      }
      setIsLoading(false);
    };
    initializeUser();
  }, [clearUser]);

  const login = useCallback(async (username: string, password: string, rememberMe: boolean): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/common/signIn', { 
        userId: username, 
        userPass: password 
      });

      const data = response.data;
      const rawData = data.result?.data || data.data || data.result || data;

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
        sessionStorage.setItem('user', JSON.stringify(newUser));
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.response?.status === 401) {
        alert("계정 정보가 일치하지 않습니다.");
      } else if (error.response?.status === 500) {
        alert("서버 내부 오류가 발생했습니다. 백엔드 설정을 확인해 주세요.");
      } else {
        alert("일시적인 오류로 로그인을 처리할 수 없습니다.");
      }
      clearUser();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clearUser]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post('/api/common/logout', null, {
        headers: {
          'Authorization': `Bearer ${user?.accessToken}`,
        }
      });
    } catch (error) {
      console.error(error);
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
