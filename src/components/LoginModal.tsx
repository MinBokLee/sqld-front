import React, { useState } from 'react';
import { X, User, Lock, Database, MessageSquare, Search } from 'lucide-react'; 
import { useUser } from '../contexts/UserContext';

/**
 * 로그인 모달 프로프 타입 정의
 * isOpen: 모달 표시 여부
 * onClose: 모달 닫기 함수
 * getText: 다국어 지원 텍스트 가져오기 함수
 * onOpenSignUpFromLogin: 로그인 창에서 회원가입 모달로 전환하는 함수
 * onOpenPasswordReset: 비밀번호 찾기 모달을 여는 함수
 */
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  getText: (key: string) => string;
  onOpenSignUpFromLogin: () => void;
  onOpenPasswordReset: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, getText, onOpenSignUpFromLogin, onOpenPasswordReset }) => {
  // --- 상태 관리 (State) ---
  const [username, setUsername] = useState(''); // 입력된 아이디
  const [password, setPassword] = useState(''); // 입력된 비밀번호
  const [rememberMe, setRememberMe] = useState(false); // 자동 로그인 체크 여부

  // UserContext에서 로그인 처리 함수와 로딩 상태를 가져옴
  const { login, isLoading } = useUser();

  /**
   * 로그인 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 유효성 검사: 아이디와 비밀번호가 비어있는지 확인
    if (!username || !password) {
      alert('아이디와 비밀번호를 모두 입력해 주세요.');
      return;
    }

    // 서버에 로그인 요청 (입력한 아이디, 비밀번호, 자동로그인 여부 전달)
    const success = await login(username, password, rememberMe);
    if (success) {
      // 로그인 성공 시 모달 닫기
      onClose();
    }
  };

  // 모달이 열려있지 않으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  return (
    /* 모달 배경 (바깥 클릭 시 닫힘) */
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      {/* 모달 본체 (이벤트 버블링 방지) */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-xl rounded-xl overflow-hidden border border-primary/10" onClick={(e) => e.stopPropagation()}>

        {/* 우측 상단 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors z-20"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 헤더 섹션: 로고 및 타이틀 */}
        <div className="pt-10 pb-6 px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Database className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{getText('login.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{getText('login.subtitle')}</p>
        </div>

        <div className="px-8 pb-8">
          {/* 로그인 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 아이디 입력 영역 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="username">{getText('login.id')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white"
                  id="username"
                  placeholder={getText('login.id_placeholder')}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* 비밀번호 입력 영역 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">{getText('login.password')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white"
                  id="password"
                  placeholder={getText('login.password_placeholder')}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* 체크박스 및 비밀번호 찾기 */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center cursor-pointer group">
                <input 
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/40 bg-white cursor-pointer" 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="ml-2 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors font-bold">{getText('login.remember_me')}</span>
              </label>
              <button 
                type="button"
                className="text-primary hover:underline font-medium focus:outline-none" 
                onClick={onOpenPasswordReset}
              >
                {getText('login.find_credentials')}
              </button>
            </div>

            {/* 로그인 버튼 */}
            <button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg shadow-md shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : getText('common.login')}
            </button>
          </form>

          {/* SNS 로그인 구분선 */}
          {/* <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-4 text-slate-400">{getText('login.social_login')}</span>
            </div>
          </div> */}

          {/* SNS 로그인 버튼 영역 (카카오, 네이버) */}
          {/* <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center py-2.5 px-4 rounded-lg bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#3C1E1E] transition-colors">
              <MessageSquare className="w-4 h-4 mr-2" />
              <span className="text-xs font-bold">{getText('login.kakao_login')}</span>
            </button>
            <button className="flex items-center justify-center py-2.5 px-4 rounded-lg bg-[#03C75A] hover:bg-[#03C75A]/90 text-white transition-colors">
              <Search className="w-4 h-4 mr-2" />
              <span className="text-xs font-bold">{getText('login.naver_login')}</span>
            </button>
          </div> */}
        </div>

        {/* 푸터 섹션: 회원가입 링크 */}
        <div className="bg-slate-50 dark:bg-slate-800/50 py-4 px-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {getText('login.no_account_yet')}
            <a className="text-primary font-bold ml-1 hover:underline cursor-pointer" onClick={onOpenSignUpFromLogin}>
              {getText('common.signup')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;