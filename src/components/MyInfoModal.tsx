import React, { useState, useRef } from 'react';
import { 
  X, Camera, User, Mail, Shield, 
  CheckCircle2, AlertCircle, Loader2, Bookmark, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useAlert } from '../contexts/AlertContext';

interface MyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  getText: (key: string) => string;
}

export default function MyInfoModal({ isOpen, onClose, getText }: MyInfoModalProps) {
  const { user, updateUser } = useUser();
  const { showAlert, showToast } = useAlert();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('upload', file);
    formData.append('memberId', user.memberId);

    try {
      const response = await fetch(`/api/board/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`
        },
        body: formData,
      });
      const result = await response.json();
      const imageUrl = result.url || result.result?.data?.[0];

      if (imageUrl) {
        const saveRes = await fetch(`/api/member/profile-image`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}` 
          },
          body: JSON.stringify({ 
            memberId: user.memberId, 
            profileImage: imageUrl 
          }),
        });

        if (saveRes.ok) {
          updateUser({ profileImage: imageUrl });
          showToast("프로필 이미지가 성공적으로 변경되었습니다. ✨", 'success');
        }
      }
    } catch (error) {
      showToast("이미지를 올리는 중에 문제가 생겼어요. ⏳", 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1a222c] rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">회원 정보</h2>
            <p className="text-sm text-slate-500 font-bold mt-1">회원님의 소중한 정보를 관리하세요.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all shadow-sm">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 sm:p-10 space-y-8">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={handleImageClick}>
              <div className="size-28 rounded-[2.5rem] overflow-hidden bg-primary/5 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl relative">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-primary/20" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                    <Loader2 size={32} className="text-primary animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 p-3 bg-primary text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 border-4 border-white dark:border-slate-900">
                <Camera size={20} />
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">사진을 클릭하여 변경</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 gap-4">
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <User size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">사용자 이름</span>
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white">{user.userName}</p>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Mail size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">이메일 계정</span>
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white">{user.userEmail || '이메일 정보 없음'}</p>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Shield size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">회원 등급</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900 dark:text-white">{user.userRole || '일반 회원'}</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded uppercase tracking-tighter">Verified</span>
              </div>
            </div>
          </div>

          {/* Status Note */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-500 mt-0.5" />
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed font-medium">
              회원님의 정보는 안전하게 암호화되어 보호되고 있습니다. <br/>개인정보 수정을 원하시면 관리자에게 문의해 주세요.
            </p>
          </div>
        </div>

        {/* Footer with MyPage Link */}
        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <Link 
            to="/mypage" 
            onClick={onClose}
            className="flex items-center justify-between w-full p-4 bg-primary text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 active:scale-95 group"
          >
            <div className="flex items-center gap-3">
              <Bookmark size={20} />
              <span className="text-sm uppercase tracking-widest">스크랩 및 활동 관리</span>
            </div>
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button onClick={onClose} className="w-full py-4 text-slate-500 font-black rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xs uppercase tracking-widest">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
