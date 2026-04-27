import axios from 'axios';

export interface BoardMaster {
  boardCode: string;
  boardName: string;
  replyYn: 'Y' | 'N';
  fileYn: 'Y' | 'N';
  tagYn: 'Y' | 'N';
  categoryGroupCode?: string;
  sortOrder?: number;
  useYn: 'Y' | 'N';
  categories?: {
    categoryId: string;
    categoryName: string;
  }[];
}

export interface CommonCodeGroup {
  groupCode: string;
  groupName: string;
  sortOrder: number;
  useYn: 'Y' | 'N';
}

export interface CommonCodeDetail {
  groupCode: string;
  codeId: string;
  codeName: string;
  sortOrder: number;
  useYn: 'Y' | 'N';
}

/**
 * Backend API standard configuration for Unified Hosting (Nginx + Cloudflare)
 */
const api = axios.create({
  baseURL: '', 
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT 만료 여부 체크 유틸리티
const isTokenExpired = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true;
  }
};

// Request Interceptor: 모든 요청에 토큰 자동 부착 및 선제적 만료 체크
api.interceptors.request.use((config) => {
  try {
    const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.accessToken) {
        // [강화] 서버로 보내기 전에 토큰 만료 여부를 로컬에서 즉시 판별
        if (isTokenExpired(user.accessToken)) {
          // 토큰이 이미 죽었다면 서버 문을 두드리지 않고 그 자리에서 요청 취소 및 세션 파괴
          console.warn('⚠️ [Pre-emptive Guard] Token already expired. Blocking request to prevent server error logs.');
          
          sessionStorage.clear();
          localStorage.removeItem('user');
          localStorage.removeItem('rememberMe');
          
          // 전역 알림 시스템 호출 (App.tsx에서 수신)
          window.dispatchEvent(new CustomEvent('auth-error', { 
            detail: { message: '보안 세션이 만료되었습니다. 다시 로그인해 주세요. 🔒' } 
          }));
          
          // Axios 요청 중단 (Cancel)
          return Promise.reject(new Error('SESSION_EXPIRED_PREEMPTIVE'));
        }
        config.headers.Authorization = `Bearer ${user.accessToken}`;
      }
    }
  } catch (e) {
    console.error('Failed to parse user session for interceptor');
  }
  return config;
}, (error) => Promise.reject(error));

// 리프레시 진행 중 상태 관리
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Response Interceptor: 401 Unauthorized 감지 시 자동 리프레시
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 발생 시 (토큰 만료) 및 리프레시 요청 자체가 아닌 경우, 또한 로그인 요청이 아닌 경우
    // 로그아웃 호출 중 에러가 발생했을 때, 자동으로 알림창을 띄우지 못하게 설정
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url.includes('/api/auth/token-refresh') &&
      !originalRequest.url.includes('/api/auth/signIn')&&
      !originalRequest.url.includes('/api/auth/logout')
    ) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 리프레시 API 호출
        const res = await axios.post('/api/auth/token-refresh', null, { withCredentials: true });
        const data = res.data;
        const rawData = data.result?.data || data.data || data.result || data;
        
        if (rawData && rawData.accessToken) {
          const newUserInfo = rawData;
          
          // 기존 저장된 토큰 확인 (이벤트 발송용: 스토리지 갱신 전 비교)
          const currentStoredUserStr = sessionStorage.getItem('user') || localStorage.getItem('user');
          const currentStoredUser = currentStoredUserStr ? JSON.parse(currentStoredUserStr) : {};
          const isTokenChanged = currentStoredUser.accessToken !== newUserInfo.accessToken;

          // 저장소 갱신 (Remember Me 여부에 따라 분기)
          const isRemembered = localStorage.getItem('rememberMe') === 'true';
          if (isRemembered) {
            localStorage.setItem('user', JSON.stringify(newUserInfo));
          } else {
            sessionStorage.setItem('user', JSON.stringify(newUserInfo));
          }
          
          // 실패했던 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${newUserInfo.accessToken}`;
          processQueue(null, newUserInfo.accessToken);
          
          // 기존 토큰과 변경된 경우에만 이벤트 발송 (무한 루프 방지 핵심)
          if (isTokenChanged) {
            window.dispatchEvent(new CustomEvent('auth-token-refreshed', { detail: newUserInfo }));
          }
          
          return api(originalRequest);
        }
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        
        // [강화] 리프레시 실패 시 사유 분석 및 안전한 뒷정리
        const errorData = refreshError.response?.data;
        const isSessionExpired = errorData?.code === -2006 || errorData?.code === -2005;

        // 모든 세션 정보 즉시 파괴
        sessionStorage.clear();
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        
        // 앱에 세션 만료 이벤트 전송 (App.tsx에서 수신하여 메시지 및 로그인 창 노출)
        window.dispatchEvent(new CustomEvent('auth-error', { 
          detail: { message: isSessionExpired ? '보안 세션이 만료되었습니다. 다시 로그인해 주세요. 🔒' : '인증 오류가 발생했습니다. 다시 로그인해 주세요.' } 
        }));
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 그 외의 에러 처리
    if (error.response) {
      const serverMsg = error.response.data?.msg;
      const status = error.response.status;
      
      if (serverMsg) {
        // [핵심] 서버 메시지를 에러 객체에 담고 전역 이벤트 발송
        error.message = serverMsg;
        
        // 401 에러는 auth-error에서 별도로 처리하므로 제외
        if (status !== 401) {
          window.dispatchEvent(new CustomEvent('api-error', { 
            detail: { message: serverMsg, status } 
          }));
        }
      }
      console.error(`API Error (${status}):`, serverMsg || error.message);
    } else if (!error.request) {
      // 설정 에러 등
    } else {
      // 네트워크 연결 실패 등
      window.dispatchEvent(new CustomEvent('api-error', { 
        detail: { message: '서버와의 통신이 원활하지 않습니다. 🌐', status: 0 } 
      }));
    }
    return Promise.reject(error);
  }
);

export default api;
