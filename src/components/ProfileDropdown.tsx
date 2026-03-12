import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, MessageSquare, LogOut, 
  Settings, ChevronRight, Clock, Camera, Lock, UserMinus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import WithdrawalModal from './WithdrawalModal'; 
import { useUser } from '../contexts/UserContext';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPasswordReset: () => void;
  user: any;
  onLogout: () => void;
  getText: (key: string) => string;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose, onOpenPasswordReset, user, onLogout, getText }) => {
  const navigate = useNavigate();
  const { updateUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false); 
  const [isWithdrawing, setIsWithdrawing] = useState(false); 
  
  const [stats, setStats] = useState({ 
    postCount: user?.postCount || 0, 
    commentCount: user?.commentCount || 0 
  });
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setStats({
        postCount: user.postCount ?? 0,
        commentCount: user.commentCount ?? 0
      });
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user?.memberId) {
      fetchMyActivity();
    }
  }, [isOpen, user?.memberId]);

  const fetchMyActivity = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/member/readMemberSimpleInfo?memberId=${user.memberId}`, {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      });
      const data = await response.json();
      
      if (data.success && data.result && data.result.data) {
        const info = data.result.data;
        setStats({ 
          postCount: info.postCount ?? 0, 
          commentCount: info.commentCount ?? 0 
        });
      }
    } catch (error) {
      console.error("Failed to fetch simple member info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('upload', file);
    formData.append('memberId', user.memberId); // 기준 식별자: memberId 사용

    try {
      const response = await fetch(`/api/board/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.accessToken}` },
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
          body: JSON.stringify({ memberId: user.memberId, profileImage: imageUrl }), // 기준 식별자: memberId 사용
        });

        if (saveRes.ok) {
          updateUser({ profileImage: imageUrl });
          alert("프로필 이미지가 변경되었습니다.");
        }
      }
    } catch (error) {
      alert("이미지 업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  const handleWithdrawalConfirm = async () => {
    setIsWithdrawing(true);
    try {
      const response = await fetch(`/api/member/${user.memberId}`, { // 기준 식별자: memberId 사용
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      });

      if (response.ok) {
        alert("회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
        setIsWithdrawalModalOpen(false);
        onLogout(); 
      } else {
        alert("탈퇴 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <>
      <div 
        ref={dropdownRef}
        className="absolute top-full right-0 mt-2 w-[320px] bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer flex-shrink-0" onClick={handleImageClick}>
              <div className="size-14 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/5 shadow-sm">
                {user.profileImage ? (
                  <img src={user.profileImage.startsWith('http') ? user.profileImage : user.profileImage} alt="P" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black text-primary uppercase">{user.userName?.[0] || 'U'}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera size={14} className={uploading ? "animate-pulse" : ""} />
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base font-black text-slate-900 dark:text-white truncate">{user.userName}</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                  user.userRole === 'ADMIN' ? 'bg-red-500 text-white' : 'bg-primary text-white'
                }`}>
                  {user.userRole || 'Member'}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-bold">
                  아이디: <span className="text-slate-400">{user.userId}</span>
                </p>
                {user.lastLogAt && (
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                    <Clock size={10} />
                    최근 접속: {user.lastLogAt}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
                    <FileText size={10} /> 글 {stats.postCount}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                    <MessageSquare size={10} /> 댓글 {stats.commentCount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-2 space-y-0.5">
          <Link 
            to={`/practice-exams?memberId=${user.memberId}`} 
            onClick={onClose}
            className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <FileText size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
              <span className="text-xs font-bold">내 활동 관리</span>
            </div>
            <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <button 
            onClick={() => { onClose(); onOpenPasswordReset(); }}
            className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Lock size={16} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
              <span className="text-xs font-bold">비밀번호 변경</span>
            </div>
            <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button 
            className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Settings size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-xs font-bold">정보 수정</span>
            </div>
            <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button 
            onClick={() => { onClose(); setIsWithdrawalModalOpen(true); }}
            className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
          >
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <UserMinus size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
              <span className="text-xs font-bold group-hover:text-red-500">회원 탈퇴</span>
            </div>
            <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
          <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 text-red-500 border border-red-100 dark:border-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-black text-xs shadow-sm"
          >
            <LogOut size={14} />
            {getText('common.logout')}
          </button>
        </div>
      </div>

      <WithdrawalModal 
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        onConfirm={handleWithdrawalConfirm}
        isLoading={isWithdrawing}
      />
    </>
  );
};

export default ProfileDropdown;
