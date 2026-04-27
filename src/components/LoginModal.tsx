import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Lock, LogIn, 
  ArrowRight, Github, Chrome, MessageCircle, AlertCircle, CheckCircle2,
  Eye, EyeOff
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useAlert } from '../contexts/AlertContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  getText: (key: string) => string;
  onOpenSignUpFromLogin: () => void;
  onOpenPasswordReset: () => void;
}

export default function LoginModal({ 
  isOpen, 
  onClose, 
  getText, 
  onOpenSignUpFromLogin,
  onOpenPasswordReset
}: LoginModalProps) {
  const { login } = useUser();
  const { showAlert } = useAlert();
  const [userId, setUserId] = useState('');
  const [userPass, setUserPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 배경 스크롤 방지 로직
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !userPass.trim()) {
      showAlert({ type: 'warning', message: "입력되지 않은 내용이 있습니다. ⚠️ 아이디와 비밀번호를 모두 입력해 주세요." });
      return;
    }

    setIsLoading(true);
    const success = await login(userId, userPass, rememberMe);
    setIsLoading(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-[#1a222c] rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button onClick={onClose} className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all z-10">
          <X size={20} />
        </button>

        <div className="p-8 sm:p-10">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-primary/10 rounded-2xl text-primary mb-4 shadow-inner">
              <LogIn size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{getText('login.title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-2">{getText('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="group space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{getText('login.id')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  required
                  type="text"
                  placeholder={getText('login.id_placeholder')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>

            <div className="group space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{getText('login.password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder={getText('login.password_placeholder')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-12 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
                  value={userPass}
                  onChange={(e) => setUserPass(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    className="peer sr-only"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 rounded-md peer-checked:bg-primary peer-checked:border-primary transition-all" />
                  <CheckCircle2 className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" size={12} strokeWidth={4} />
                </div>
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  {getText('login.remember_me')}
                </span>
              </label>
              <button 
                type="button"
                onClick={onOpenPasswordReset}
                className="text-xs font-black text-primary hover:underline underline-offset-4"
              >
                {getText('login.find_credentials')}
              </button>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full h-[56px] bg-primary text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {getText('common.login')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-6">
            <p className="text-sm font-bold text-slate-500">
              {getText('login.no_account_yet')}{' '}
              <button 
                onClick={onOpenSignUpFromLogin}
                className="text-primary font-black hover:underline underline-offset-4 ml-1"
              >
                지금 가입하기
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
