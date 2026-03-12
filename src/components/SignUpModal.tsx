import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, CheckCircle2, ShieldCheck, Clock, Send, AlertCircle, Check } from 'lucide-react';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  getText: (key: string) => string;
}

// const API_BASE_URL = "http://localhost:8881";

export default function SignUpModal({ isOpen, onClose, getText }: SignUpModalProps) {
  const [formData, setSignUpData] = useState({
    userId: '',
    userName: '',
    userEmail: '',
    userPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    userId: '',
    userName: '',
    userEmail: '',
    userPassword: '',
    confirmPassword: '',
  });

  const [successMsgs, setSuccessMsgs] = useState({
    userId: '',
    userName: '',
  });

  const [idChecked, setIdChecked] = useState(false);
  const [nameChecked, setNameChecked] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Unified Validation Effect with Clear Logic
  useEffect(() => {
    const newErrors = { ...errors };

    // 1. User ID Validation
    if (formData.userId && !/^[a-z0-9]{4,20}$/.test(formData.userId)) {
      newErrors.userId = '아이디는 4~20자의 영문 소문자, 숫자만 가능합니다.';
    } else {
      newErrors.userId = ''; // Ensure error is cleared when valid
    }
    
    // 2. User Name Validation (Fix for the reported bug)
    if (formData.userName && !/^[a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ\s]{2,20}$/.test(formData.userName)) {
      newErrors.userName = '이름은 2~20자의 한글 또는 영문만 가능합니다.';
    } else {
      newErrors.userName = ''; // Clear error when input becomes valid
    }

    // 3. Email Validation
    if (formData.userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
      newErrors.userEmail = '올바른 이메일 형식이 아닙니다.';
    } else {
      newErrors.userEmail = ''; 
    }

    // 4. Password Validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (formData.userPassword && !passwordRegex.test(formData.userPassword)) {
      newErrors.userPassword = '8자 이상, 영문/숫자/특수문자를 모두 포함해야 합니다.';
    } else {
      newErrors.userPassword = '';
    }

    // 5. Confirm Password Validation
    if (formData.confirmPassword && formData.userPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    } else {
      newErrors.confirmPassword = '';
    }

    setErrors(newErrors);
  }, [formData.userId, formData.userName, formData.userEmail, formData.userPassword, formData.confirmPassword]);

  const checkIdDuplication = async () => {
    if (!formData.userId || errors.userId) return;
    try {
      const response = await fetch(`/api/common/check-id?userId=${formData.userId}`);
      const data = await response.json();
      if (data.success) {
        setIdChecked(true);
        setSuccessMsgs(prev => ({ ...prev, userId: data.msg }));
        setErrors(prev => ({ ...prev, userId: '' }));
      } else {
        setIdChecked(false);
        setErrors(prev => ({ ...prev, userId: data.msg }));
        setSuccessMsgs(prev => ({ ...prev, userId: '' }));
      }
    } catch (e) { console.error(e); }
  };

  const checkNameDuplication = async () => {
    if (!formData.userName || errors.userName) return;
    try {
      const response = await fetch(`/api/common/check-name?userName=${formData.userName}`);
      const data = await response.json();
      if (data.success) {
        setNameChecked(true);
        setSuccessMsgs(prev => ({ ...prev, userName: data.msg }));
        setErrors(prev => ({ ...prev, userName: '' }));
      } else {
        setNameChecked(false);
        setErrors(prev => ({ ...prev, userName: data.msg }));
        setSuccessMsgs(prev => ({ ...prev, userName: '' }));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    let timer: any;
    if (isCodeSent && !isVerified && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isCodeSent, isVerified, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    if (errors.userEmail || !formData.userEmail) return alert("올바른 이메일을 입력하세요.");
    setIsSending(true);
    try {
      const response = await fetch(`/api/common/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.userEmail })
      });
      const data = await response.json();
      
      // Fix: Check both response.ok AND data.success to prevent triggering code input on business errors
      if (response.ok && data.success) {
        setIsCodeSent(true);
        setTimeLeft(300);
        alert(data.msg || "인증번호가 발송되었습니다.");
      } else {
        // Ensure UI doesn't transition to 'code sent' state
        setIsCodeSent(false);
        
        // Handle specific security error codes from backend
        if (data.code === 'existsMemberException') {
          alert("이미 가입된 회원입니다. 로그인하시거나 다른 이메일을 사용해 주세요.");
          setErrors(prev => ({ ...prev, userEmail: "이미 가입된 회원입니다." }));
        } else if (data.code === 'existMailException') {
          alert("이미 인증이 완료된 이메일입니다. 가입을 진행해 주세요.");
        } else {
          alert(data.msg || "발송 실패");
        }
      }
    } catch (error) { 
      alert("서버 오류가 발생했습니다."); 
    } finally { 
      setIsSending(false); 
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) return alert("6자리 인증번호를 입력하세요.");
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/common/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.userEmail, code: verificationCode })
      });
      const data = await response.json();
      if (response.ok) {
        setIsVerified(true);
        alert("이메일 인증이 완료되었습니다.");
      } else { alert(data.msg || "인증번호 오류"); }
    } catch (error) { alert("서버 오류"); } finally { setIsVerifying(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idChecked || !nameChecked || !isVerified) return alert("중복 확인 및 이메일 인증을 완료해주세요.");

    try {
      const response = await fetch(`/api/common/signUp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formData.userId,
          userName: formData.userName,
          userEmail: formData.userEmail,
          userPass: formData.userPassword, // Changed to userPass to match backend spec
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert("회원가입이 완료되었습니다!");
        onClose();
      } else { alert(`회원가입 실패: ${data.msg}`); }
    } catch (error) { alert("서버 오류"); }
  };

  if (!isOpen) return null;

  const isFormValid = !Object.values(errors).some(msg => msg !== '') && 
                      formData.userId && formData.userName && idChecked && nameChecked && isVerified;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">회원가입</h2>
              <p className="text-sm text-slate-500 font-bold mt-1">새로운 시작을 함께하세요.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="relative group">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.userId ? 'text-red-400' : idChecked ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-primary'}`} size={20} />
                  <input
                    required
                    className={`w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 outline-none font-bold text-sm transition-all ${errors.userId ? 'border-red-100 focus:border-red-400' : idChecked ? 'border-emerald-100' : 'border-transparent focus:ring-2 focus:ring-primary/20'}`}
                    placeholder="아이디 (4~20자 영문/숫자)"
                    type="text"
                    value={formData.userId}
                    onChange={(e) => { setSignUpData({ ...formData, userId: e.target.value }); setIdChecked(false); setSuccessMsgs({...successMsgs, userId: ''}); }}
                    onBlur={checkIdDuplication}
                  />
                </div>
                {errors.userId && <p className="text-[11px] text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.userId}</p>}
                {idChecked && !errors.userId && <p className="text-[11px] text-emerald-600 font-bold ml-2 flex items-center gap-1"><Check size={12}/> {successMsgs.userId}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <ShieldCheck className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.userName ? 'text-red-400' : nameChecked ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-primary'}`} size={20} />
                  <input
                    required
                    className={`w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 outline-none font-bold text-sm transition-all ${errors.userName ? 'border-red-100 focus:border-red-400' : nameChecked ? 'border-emerald-100' : 'border-transparent focus:ring-2 focus:ring-primary/20'}`}
                    placeholder="이름 (실명/닉네임)"
                    type="text"
                    value={formData.userName}
                    onChange={(e) => { setSignUpData({ ...formData, userName: e.target.value }); setNameChecked(false); setSuccessMsgs({...successMsgs, userName: ''}); }}
                    onBlur={checkNameDuplication}
                  />
                </div>
                {errors.userName && <p className="text-[11px] text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.userName}</p>}
                {nameChecked && !errors.userName && <p className="text-[11px] text-emerald-600 font-bold ml-2 flex items-center gap-1"><Check size={12}/> {successMsgs.userName}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.userEmail ? 'text-red-400' : isVerified ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-primary'}`} size={20} />
                    <input required readOnly={isVerified} className={`w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 outline-none font-bold text-sm transition-all ${isVerified ? 'opacity-60 bg-slate-100' : errors.userEmail ? 'border-red-100' : 'border-transparent focus:ring-2 focus:ring-primary/20'}`} placeholder="이메일 주소" type="email" value={formData.userEmail} onChange={(e) => setSignUpData({ ...formData, userEmail: e.target.value })} />
                  </div>
                  {!isVerified && (
                    <button type="button" disabled={isSending || !formData.userEmail || !!errors.userEmail} onClick={handleSendCode} className="px-4 h-14 bg-primary text-white font-black text-xs rounded-2xl hover:bg-blue-600 transition-all disabled:opacity-30 min-w-[90px] shadow-lg shadow-primary/20">
                      {isSending ? '...' : isCodeSent ? '재발송' : '인증요청'}
                    </button>
                  )}
                  {isVerified && <div className="h-14 px-4 flex items-center gap-1.5 text-emerald-500 bg-emerald-50 rounded-2xl border border-emerald-100"><CheckCircle2 size={18} /><span className="text-xs font-black">완료</span></div>}
                </div>
                {errors.userEmail && <p className="text-[11px] text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.userEmail}</p>}
                {isCodeSent && !isVerified && (
                  <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="relative flex-1">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                      <input required className="w-full h-14 pl-12 pr-16 rounded-2xl bg-white border-2 border-primary outline-none font-black text-sm tracking-[0.3em]" placeholder="인증번호" maxLength={6} type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded-lg">{formatTime(timeLeft)}</span>
                    </div>
                    <button type="button" disabled={isVerifying || verificationCode.length !== 6 || timeLeft === 0} onClick={handleVerifyCode} className="px-6 h-14 bg-slate-900 text-white font-black text-xs rounded-2xl hover:bg-black transition-all">{isVerifying ? '..' : '확인'}</button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.userPassword ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary'}`} size={20} />
                  <input required className={`w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all ${errors.userPassword ? 'border-red-100 focus:border-red-400' : ''}`} placeholder="비밀번호 (영문/숫자/특수문자)" type="password" value={formData.userPassword} onChange={(e) => setSignUpData({ ...formData, userPassword: e.target.value })} />
                </div>
                {errors.userPassword && <p className="text-[11px] text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.userPassword}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary'}`} size={20} />
                  <input required className={`w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all ${errors.confirmPassword ? 'border-red-100 focus:border-red-400' : ''}`} placeholder="비밀번호 재입력" type="password" value={formData.confirmPassword} onChange={(e) => setSignUpData({ ...formData, confirmPassword: e.target.value })} />
                </div>
                {errors.confirmPassword && <p className="text-[11px] text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.confirmPassword}</p>}
              </div>
            </div>

            <button
              disabled={!isFormValid}
              className={`w-full h-14 rounded-2xl font-black text-sm transition-all shadow-xl mt-4 flex items-center justify-center gap-2 ${
                isFormValid ? 'bg-primary text-white hover:bg-blue-600 active:scale-[0.98] shadow-primary/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
              type="submit"
            >
              <Send size={18} /> 회원가입 완료
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
