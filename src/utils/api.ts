import axios from 'axios';

/**
 * [Interfaces]
 */
export interface BoardMaster {
  boardCode: string;
  boardName: string;
  replyYn: 'Y' | 'N';
  fileYn: 'Y' | 'N';
  tagYn: 'Y' | 'N';
  groupCode?: string;
  categoryGroupCode?: string;
  sortOrder?: number;
  useYn: 'Y' | 'N';
  categories?: {
    categoryId: string;
    categoryName: string;
  }[];
}

/**
 * [Helper] JWT 토큰 만료 여부 확인
 * @param token JWT 토큰 스트링
 * @returns 만료되었거나 토큰이 없으면 true, 유효하면 false
 */
export const isTokenExpired = (token: string | null | undefined): boolean => {
  if (!token) return true;
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const decoded = JSON.parse(decodedJson);
    const exp = decoded.exp;
    if (!exp) return false; // exp 필드가 없으면 무기한 토큰으로 간주
    
    // exp는 초 단위이므로 밀리초로 변환 (현재 시간보다 5초 정도 여유를 둠)
    return (Date.now() / 1000) >= (exp - 5);
  } catch (e) {
    console.error('Failed to parse JWT token:', e);
    return true; 
  }
};

const api = axios.create({
  baseURL: '', 
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: 토큰 자동 부착 및 사전 검증
api.interceptors.request.use(async (config) => {
  const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const token = user.accessToken;

      if (token) {
        // 사전 검증: 토큰이 만료되었다면 경고 로그 출력
        if (isTokenExpired(token)) {
          console.warn('⚠️ Access Token expired. Token refresh might be needed.');
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) { console.error("Session parse error"); }
  }
  return config;
}, (error) => Promise.reject(error));

/**
 * [Response Interceptor]
 * 토큰 만료(401) 시 자동 갱신 로직 추가
 */
api.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res && res.success === true) {
      const payload = (res.data !== undefined && res.data !== null && (!Array.isArray(res.data) || res.data.length > 0))
        ? res.data 
        : (res.result?.data !== undefined ? res.result.data : (res.result !== undefined ? res.result : res));
      return payload;
    }
    
    if (res && res.success === false) {
      window.dispatchEvent(new CustomEvent('api-error', { 
        detail: { message: res.msg || '요청 처리에 실패했습니다.', status: response.status } 
      }));
      return Promise.reject(res);
    }
    return res;
  },
  async (error) => {
    const { config, response } = error;
    
    // 1. 401 Unauthorized 에러 발생 시 (토큰 만료)
    // 단, 로그인 API는 갱신 로직을 타지 않아야 함
    if (response && response.status === 401 && !config._retry && !config.url?.includes('/api/auth/signIn')) {
      config._retry = true; // 무한 루프 방지
      
      try {
        console.log('🔄 Token expired. Attempting refresh via reissue...');
        
        const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (!userStr) throw new Error('No user data found in storage');
        
        const userData = JSON.parse(userStr);
        const { refreshToken, memberId } = userData;

        // 기술 가이드 준수: /api/sign/reissue 호출
        const refreshRes: any = await axios.post('/api/sign/reissue', {
          refreshToken,
          memberId
        }, { withCredentials: true });
        
        const rawRefreshData = refreshRes.data?.data || refreshRes.data;
        
        if (rawRefreshData && rawRefreshData.accessToken) {
          const newToken = rawRefreshData.accessToken;
          const newRefreshToken = rawRefreshData.refreshToken || refreshToken;
          
          // 로컬 저장소 업데이트
          const updatedUser = { ...userData, accessToken: newToken, refreshToken: newRefreshToken };
          const updatedUserStr = JSON.stringify(updatedUser);
          
          if (sessionStorage.getItem('user')) sessionStorage.setItem('user', updatedUserStr);
          if (localStorage.getItem('user')) localStorage.setItem('user', updatedUserStr);
          
          // UserContext 동기화를 위한 이벤트 발송
          window.dispatchEvent(new CustomEvent('auth-token-refreshed', { 
            detail: updatedUser 
          }));

          // 실패했던 원래 요청의 헤더 교체 및 재시도
          config.headers.Authorization = `Bearer ${newToken}`;
          return api(config);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed. Logging out...');
        sessionStorage.clear();
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        
        const authError = new Error('보안 세션이 만료되어 자동으로 로그아웃되었습니다.');
        (authError as any).isAuthError = true;
        (authError as any).status = 401;

        window.dispatchEvent(new CustomEvent('auth-error', { 
          detail: { message: authError.message } 
        }));
        return Promise.reject(authError);
      }
    }

    // 2. 일반 에러 처리
    if ((error as any).isAuthError) {
      return Promise.reject(error);
    }

    if (response && response.data) {
      const serverData = response.data;
      window.dispatchEvent(new CustomEvent('api-error', { 
        detail: { message: serverData.msg || "서버 통신 중 오류가 발생했습니다.", status: response.status } 
      }));
    }
    return Promise.reject(error);
  }
);

export default api;
