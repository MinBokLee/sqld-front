import React, { useState } from 'react';
import { X, User, Mail, ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'request' | 'verify' | 'reset' | 'success';

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('request');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !email) {
      setError('아이디와 이메일을 모두 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/common/pass-change/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });
      const data = await response.json();
      if (response.ok) {
        setStep('verify');
      } else {
        setError(data.message || '정보가 일치하지 않거나 요청에 실패했습니다.');
      }
    } catch (err) {
      setError('서버와의 통신에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('6자리 인증 코드를 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/common/pass-change/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, code }),
      });
      if (response.ok) {
        setStep('reset');
      } else {
        const data = await response.json();
        setError(data.message || '인증 코드가 올바르지 않습니다.');
      }
    } catch (err) {
      setError('서버와의 통신에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('비밀번호를 입력해 주세요.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/common/pass-change', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, newPassword }),
      });
      if (response.ok) {
        setStep('success');
      } else {
        const data = await response.json();
        setError(data.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (err) {
      setError('서버와의 통신에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'request':
        return (
          <form onSubmit={handleRequest} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="reset-userId">아이디</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white"
                  id="reset-userId"
                  placeholder="아이디를 입력하세요"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="reset-email">이메일</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white"
                  id="reset-email"
                  placeholder="email@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg shadow-md shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? '요청 중...' : '인증 코드 발송'}
            </button>
          </form>
        );
      case 'verify':
        return (
          <form onSubmit={handleVerify} className="space-y-5">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              입력하신 이메일로 6자리 인증 코드가 발송되었습니다.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="reset-code">인증 코드</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <input
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white tracking-widest font-mono text-center"
                  id="reset-code"
                  placeholder="000000"
                  maxLength={6}
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg shadow-md shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? '확인 중...' : '인증 코드 확인'}
            </button>
            <button
              type="button"
              onClick={() => setStep('request')}
              className="w-full text-sm text-slate-500 hover:text-primary transition-colors"
            >
              이전 단계로 돌아가기
            </button>
          </form>
        );
      case 'reset':
        return (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="new-password">새 비밀번호</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white"
                  id="new-password"
                  placeholder="새 비밀번호를 입력하세요"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="confirm-password">비밀번호 확인</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white"
                  id="confirm-password"
                  placeholder="비밀번호를 다시 입력하세요"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg shadow-md shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        );
      case 'success':
        return (
          <div className="text-center space-y-6 py-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">변경 완료!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                비밀번호가 성공적으로 변경되었습니다.<br />새로운 비밀번호로 로그인해 주세요.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
            >
              로그인하러 가기
            </button>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'request': return '비밀번호 재설정';
      case 'verify': return '인증 코드 확인';
      case 'reset': return '새 비밀번호 설정';
      case 'success': return '변경 완료';
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 'request': return '가입 시 입력한 아이디와 이메일을 입력해 주세요.';
      case 'verify': return '이메일로 발송된 코드를 입력해 주세요.';
      case 'reset': return '보안을 위해 강력한 비밀번호를 설정해 주세요.';
      case 'success': return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-xl rounded-xl overflow-hidden border border-primary/10" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors z-20"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="pt-10 pb-6 px-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{getTitle()}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{getSubtitle()}</p>
        </div>

        <div className="px-8 pb-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;
