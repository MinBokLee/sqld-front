import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Lock, CheckCircle2, ShieldCheck, Clock, Send, AlertCircle, Check,
  Eye, EyeOff, Loader2
} from 'lucide-react';
import { useAlert } from '../contexts/AlertContext';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  getText: (key: string) => string;
}

export default function SignUpModal({ isOpen, onClose, getText }: SignUpModalProps) {
  const { showAlert, showToast } = useAlert();
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
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // [추가] 실시간 자동 중복 체크 로직 (Debouncing)
  useEffect(() => {
    if (!formData.userId || errors.userId) {
      setIdChecked(false);
      return;
    }
    const timer = setTimeout(() => {
      checkIdDuplication();
    }, 600); // 0.6초간 입력이 없으면 자동 체크
    return () => clearTimeout(timer);
  }, [formData.userId, errors.userId]);

  useEffect(() => {
    if (!formData.userName || errors.userName) {
      setNameChecked(false);
      return;
    }
    const timer = setTimeout(() => {
      checkNameDuplication();
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.userName, errors.userName]);

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

  useEffect(() => {
    const newErrors = { ...errors };
    if (formData.userId && !/^[a-zA-Z0-9]{4,20}$/.test(formData.userId)) {
      newErrors.userId = '아이디는 4~20자의 영문, 숫자만 가능합니다.';
    } else {
      newErrors.userId = '';
    }
    if (formData.userName && !/^[a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ\s]{2,20}$/.test(formData.userName)) {
      newErrors.userName = '이름은 2~20자의 한글 또는 영문만 가능합니다.';
    } else {
      newErrors.userName = '';
    }
    if (formData.userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
      newErrors.userEmail = '올바른 이메일 형식이 아닙니다.';
    } else {
      newErrors.userEmail = ''; 
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (formData.userPassword && !passwordRegex.test(formData.userPassword)) {
      newErrors.userPassword = '8자 이상, 영문/숫자/특수문자를 모두 포함해야 합니다.';
    } else {
      newErrors.userPassword = '';
    }
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
    if (errors.userEmail || !formData.userEmail) {
      showToast("올바른 이메일을 입력해 주세요. ✍️");
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch(`/api/common/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.userEmail })
      });
      const data = await response.json();
      
      if (data.success) {
        setIsCodeSent(true);
        setTimeLeft(300);
        showToast(data.msg);
      } else {
        setIsCodeSent(false);
        showToast(data.msg);
        if (data.code === 'existsMemberException') {
          setErrors(prev => ({ ...prev, userEmail: data.msg }));
        }
      }
    } catch (error) { 
      showToast("인증 요청 중 오류가 발생했습니다."); 
    } finally { 
      setIsSending(false); 
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      showToast("6자리 인증번호를 입력해 주세요. ✍️");
      return;
    }
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/common/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.userEmail, code: verificationCode })
      });
      const data = await response.json();
      if (data.success) {
        setIsVerified(true);
        showToast(data.msg);
      } else { 
        showToast(data.msg); 
      }
    } catch (error) { 
      showToast("확인 중에 문제가 발생했어요. ⏳"); 
    } finally { setIsVerifying(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idChecked || !nameChecked || !isVerified) {
      showAlert({ type: 'warning', message: "필수 확인 및 인증 절차를 완료해 주세요. ⚠️" });
      return;
    }

    try {
      const response = await fetch(`/api/auth/signUp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formData.userId,
          userName: formData.userName,
          userEmail: formData.userEmail,
          userPass: formData.userPassword,
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast(data.msg, 'success');
        onClose();
      }
      } catch (error) { 
      console.error("Signup error:", error);
      }
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
                    className={`w-full h-14 pl-12 pr-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 outline-none font-bold text-sm transition-all ${errors.userId ? 'border-red-100 focus:border-red-400' : idChecked ? 'border-emerald-100' : 'border-transparent focus:ring-2 focus:ring-primary/20'}`}
                    placeholder="아이디 (4~20자 영문/숫자)"
                    type="text"
                    value={formData.userId}
                    onChange={(e) => { setSignUpData({ ...formData, userId: e.target.value }); setIdChecked(false); setSuccessMsgs({...successMsgs, userId: ''}); }}
                  />
                  {idChecked && !errors.userId && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in"><CheckCircle2 size={20} /></div>}
                </div>
                {errors.userId && <p className="text-[11px] text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.userId}</p>}
                {idChecked && !errors.userId && <p className="text-[11px] text-emerald-600 font-bold ml-2 flex items-center gap-1">{successMsgs.userId}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <ShieldCheck className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.userName ? 'text-red-400' : nameChecked ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-primary'}`} size={20} />
                  <input
                    required
                    className={`w-full h-14 pl-12 pr-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 outline-none font-bold text-sm transition-all ${errors.userName ? 'border-red-100 focus:border-red-400' : nameChecked ? 'border-emerald-100' : 'border-transparent focus:ring-2 focus:ring-primary/20'}`}
                    placeholder="이름 (실명/닉네임)"
                    type="text"
                    value={formData.userName}
                    onChange={(e) => { setSignUpData({ ...formData, userName: e.target.value }); setNameChecked(false); setSuccessMsgs({...successMsgs, userName: ''}); }}
                  />
                  {nameChecked && !errors.userName && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in"><CheckCircle2 size={20} /></div>}
                </div>
                {errors.userName && <p className="text-[11px] text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.userName}</p>}
                {nameChecked && !errors.userName && <p className="text-[11px] text-emerald-600 font-bold ml-2 flex items-center gap-1">{successMsgs.userName}</p>}
              </div>


              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.userEmail ? 'text-red-400' : isVerified ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-primary'}`} size={20} />
                    <input required readOnly={isVerified} className={`w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 outline-none font-bold text-sm transition-all ${isVerified ? 'opacity-60 bg-slate-100' : errors.userEmail ? 'border-red-100' : 'border-transparent focus:ring-2 focus:ring-primary/20'}`} placeholder="이메일 주소" type="email" value={formData.userEmail} onChange={(e) => setSignUpData({ ...formData, userEmail: e.target.value })} />
                  </div>
                  {!isVerified && (
                    <button 
                      type="button" 
                      disabled={isSending || !formData.userEmail || !!errors.userEmail} 
                      onClick={handleSendCode} 
                      className="px-4 h-14 bg-primary text-white font-black text-xs rounded-2xl hover:bg-blue-600 transition-all disabled:opacity-50 min-w-[100px] shadow-lg shadow-primary/20 flex items-center justify-center"
                    >
                      {isSending ? (
                        <div className="flex flex-col items-center gap-1">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-[9px]">발송중</span>
                        </div>
                      ) : (
                        isCodeSent ? '재발송' : '인증요청'
                      )}
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
                    <button 
                      type="button" 
                      disabled={isVerifying || verificationCode.length !== 6 || timeLeft === 0} 
                      onClick={handleVerifyCode} 
                      className="px-6 h-14 bg-slate-900 text-white font-black text-xs rounded-2xl hover:bg-black transition-all min-w-[80px] flex items-center justify-center disabled:opacity-50"
                    >
                      {isVerifying ? <Loader2 size={18} className="animate-spin" /> : '확인'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.userPassword ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary'}`} size={20} />
                  <input required className={`w-full h-14 pl-12 pr-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all ${errors.userPassword ? 'border-red-100 focus:border-red-400' : ''}`} placeholder="비밀번호 (영문/숫자/특수문자)" type={showPassword ? "text" : "password"} value={formData.userPassword} onChange={(e) => setSignUpData({ ...formData, userPassword: e.target.value })} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.userPassword && <p className="text-[11px] text-red-500 font-bold ml-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.userPassword}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary'}`} size={20} />
                  <input required className={`w-full h-14 pl-12 pr-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all ${errors.confirmPassword ? 'border-red-100 focus:border-red-400' : ''}`} placeholder="비밀번호 재입력" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={(e) => setSignUpData({ ...formData, confirmPassword: e.target.value })} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
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
