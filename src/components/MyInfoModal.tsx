import React, { useState, useEffect, useRef } from 'react';
import { 
  X, User, Mail, Shield, Calendar, Edit2, Camera, 
  FileText, MessageSquare, Heart, ChevronRight, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

interface MyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  getText: (key: string) => string;
}

export default function MyInfoModal({ isOpen, onClose, getText }: MyInfoModalProps) {
  const { user, updateUser } = useUser();
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user?.memberId) {
      fetchMyPosts();
    }
  }, [isOpen, user?.memberId]);

  const fetchMyPosts = async () => {
    if (!user?.memberId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/board/list/paging?memberId=${user.memberId}&size=5`);
      const data = await response.json();
      if (data.success && data.result) {
        setMyPosts(data.result.data?.list || []);
      }
    } catch (error) {
      console.error("Failed to fetch my posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('upload', file);
    formData.append('memberId', user.memberId); // userId -> memberId 변경

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
          body: JSON.stringify({ memberId: user.memberId, profileImage: imageUrl }), // userId -> memberId 변경
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

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
        
        {/* Modal Header & Banner */}
        <div className="relative h-32 bg-gradient-to-r from-primary to-blue-600">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all z-10"
          >
            <X size={20} />
          </button>
          
          {/* Avatar with Upload Trigger */}
          <div className="absolute -bottom-12 left-10 flex items-end gap-6">
            <div 
              className="w-24 h-24 rounded-[2rem] bg-white dark:bg-slate-800 p-1.5 shadow-xl relative group cursor-pointer"
              onClick={handleImageClick}
            >
              <div className="size-24 rounded-3xl overflow-hidden bg-primary/5 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl">
                {user.profileImage ? (
                  <img src={user.profileImage.startsWith('http') ? user.profileImage : user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-primary uppercase">{user.userName?.[0] || 'U'}</span>
                )}
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-1.5 rounded-[1.6rem] bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera size={24} className={uploading ? "animate-pulse" : ""} />
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="mb-2">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                {user.userName}
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-black uppercase tracking-widest">
                  {user.userRole}
                </span>
              </h2>
              <p className="text-white/70 text-sm font-bold">@{user.userId}</p>
            </div>
          </div>
        </div>

        <div className="p-10 pt-20 grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Left Column: Basic Info */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">기본 정보</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Mail size={16} className="text-primary" />
                  <span className="text-sm font-bold">{user.userId}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Shield size={16} className="text-emerald-500" />
                  <span className="text-sm font-bold">{user.userRole === 'ADMIN' ? '관리자 권한' : '일반 회원'}</span>
                </div>
                {user.lastLogAt && (
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <Calendar size={16} className="text-orange-500" />
                    <span className="text-sm font-bold">최근 접속: {user.lastLogAt}</span>
                  </div>
                )}
              </div>
            </div>

            <button className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 group">
              <Edit2 size={16} className="group-hover:rotate-12 transition-transform" />
              회원 정보 수정
            </button>
          </div>

          {/* Right Column: Activity Stats */}
          <div className="md:col-span-3 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">최근 활동</h3>
                <Link to={`/practice-exams?memberId=${user.memberId}`} onClick={onClose} className="text-[10px] font-black text-primary hover:underline flex items-center gap-1">
                  전체보기 <ExternalLink size={10} />
                </Link>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="h-20 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl animate-pulse">
                    <div className="text-slate-400 text-xs font-bold">데이터를 불러오는 중...</div>
                  </div>
                ) : myPosts.length > 0 ? (
                  myPosts.map((post: any) => (
                    <Link 
                      key={post.boardId} 
                      to={`/exam/${post.boardId}?type=${post.boardType}`}
                      onClick={onClose}
                      className="block p-4 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 rounded-2xl border border-transparent hover:border-primary/20 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                          {post.title}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                          {new Date(post.createAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-10 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-bold text-slate-400">아직 활동 내역이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
