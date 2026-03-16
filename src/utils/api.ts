import axios from 'axios';

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

// Request Interceptor: 모든 요청에 토큰 자동 부착
api.interceptors.request.use((config) => {
  try {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.accessToken && !config.headers.Authorization) {
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
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url.includes('/api/token-refresh') &&
      !originalRequest.url.includes('/api/common/signIn')
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
        // 리프레시 API 호출 (제공해주신 데이터 구조 반영)
        // 무한 루프 방지를 위해 기본 axios 사용
        const res = await axios.post('/api/token-refresh', null, { withCredentials: true });
        const data = res.data;
        
        // 제공된 JSON 구조: result.data.accessToken
        if (data.success && data.result?.data?.accessToken) {
          const newUserInfo = data.result.data;
          
          // 세션 저장소 갱신
          sessionStorage.setItem('user', JSON.stringify(newUserInfo));
          
          // 실패했던 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${newUserInfo.accessToken}`;
          processQueue(null, newUserInfo.accessToken);
          
          // UserContext 상태 동기화를 위해 커스텀 이벤트 발송
          window.dispatchEvent(new CustomEvent('auth-token-refreshed', { detail: newUserInfo }));
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // 리프레시 실패 시 로그아웃 처리 (강제 페이지 이동 제거하여 알림 모달 보존)
        sessionStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 그 외의 에러 처리
    console.error('API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;
