import { Database, Menu, Search, User as UserIcon, ChevronDown, ShieldCheck, X, LogOut, FileText, Smile, Megaphone, Bell } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useAlert } from '../contexts/AlertContext'; 
import { useNotification } from '../contexts/NotificationContext';
import { useState, useRef, useEffect } from 'react';
import ProfileDropdown from './ProfileDropdown';
import WithdrawalModal from './WithdrawalModal';
import api from '../utils/api';  
import { useBoard } from '../contexts/BoardContext';

interface HeaderProps {
  onOpenSignUpModal: () => void;
  onOpenLoginModal: () => void;
  onOpenPasswordReset: () => void;
  getText: (key: string) => string;
}

export default function Header({ onOpenSignUpModal, onOpenLoginModal, onOpenPasswordReset, getText }: HeaderProps) {
  const { user, logout } = useUser();
  const { showAlert, showToast } = useAlert(); 
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotification();
  const { getBoardCode, boardConfigs } = useBoard();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [headerKeyword, setHeaderKeyword] = useState(''); 
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false); 
  const [isWithdrawing, setIsWithdrawing] = useState(false); 

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const searchParams = new URLSearchParams(location.search);
  const currentCode = searchParams.get('boardCode');
  
  const isTargetPage = ['/practice-exams', '/exam', '/write-post'].some(path => location.pathname.startsWith(path));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsProfileOpen(false);
    setIsNotificationOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerKeyword.trim()) {
      navigate(`/practice-exams?boardCode=S&page=1&keyword=${encodeURIComponent(headerKeyword.trim())}`);
      setHeaderKeyword('');
      setIsMobileMenuOpen(false);
    } else {
      let message = "키워드를 입력해 주세요. ⚠️ 검색어 없이 조회를 진행할 수 없습니다.";
      if (currentCode === 'N') message = "확인하실 공지사항 키워드를 입력해 주세요. 📢";
      else if (currentCode === 'S') message = "키워드를 입력해 주세요. ⚠️ 학습 게시판 내에서 검색어를 통해 조회가 가능합니다.";
      else if (currentCode === 'G') message = "찾으시는 회원님이나 인사말 키워드를 입력해 주세요. 😊";
      
      showToast(message, 'warning');
    }
  };

  const handleWithdrawalConfirm = async () => {
    if (!user) return;
    setIsWithdrawing(true);
    try {
      const response = await api.delete(`/api/member/deleteMember/${user.memberId}`);
      showToast(response.data.msg || "회원 탈퇴가 완료되었습니다. ✨", 'success');
      setIsWithdrawalModalOpen(false);
      logout(); 
    } catch (error) {
      console.error("Withdrawal error:", error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getMenuClass = (code: string | null) => {
    const isActive = isTargetPage && currentCode === code;
    const isStudyActive = isTargetPage && (
      (currentCode === 'S') || 
      (location.pathname === '/practice-exams' && !currentCode && code === 'S')
    );
    
    const activeClass = "text-primary dark:text-primary";
    const inactiveClass = "text-[#4c739a] hover:text-primary dark:text-slate-400 dark:hover:text-primary";
    
    if (code === 'S') return isStudyActive ? activeClass : inactiveClass;
    return isActive ? activeClass : inactiveClass;
  };

  const getProfileImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return formattedPath;
  };


  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-solid border-[#e7edf3] dark:border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-primary">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-[#0d141b] dark:text-white text-xl font-bold leading-tight tracking-tight hidden sm:block">
                SQLD Community
              </h2>
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
              {boardConfigs.filter(config => config.useYn === 'Y').map((config) => (
                <Link 
                  key={config.boardCode}
                  to={`/practice-exams?boardCode=${config.boardCode}`} 
                  className={`${getMenuClass(config.boardCode)} text-sm font-semibold transition-colors`}
                >
                  {config.boardName}
                </Link>
              ))}
              {['ADMIN', 'SUPER_ADMIN'].includes(user?.userRole || '') && (
                <Link to="/admin/members" className="text-red-500 hover:text-red-600 text-sm font-black transition-colors flex items-center gap-1">
                  <ShieldCheck size={16} /> 시스템 설정
                </Link>
              )}
            </nav>
          </div>

          <div className="flex-1 max-w-lg hidden md:block ml-4">
            <form onSubmit={handleHeaderSearch} className="relative flex items-center">
              <div className="absolute left-4 text-[#64748b] pointer-events-none">
                <Search className="w-[18px] h-[18px]" />
              </div>
              <input
                type="text"
                value={headerKeyword}
                onChange={(e) => setHeaderKeyword(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-xl border-none bg-[#f1f5f9] dark:bg-slate-800 text-[#0d141b] dark:text-white placeholder:text-[#64748b] focus:ring-2 focus:ring-primary focus:outline-none text-[14px] font-medium"
                placeholder={'SQLD 학습 게시판 전용 검색창 입니다.'}
              />
            </form>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notiRef}>
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className={`p-2 rounded-xl transition-all relative ${isNotificationOpen ? 'bg-slate-100 dark:bg-slate-800 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                  >
                    <Bell size={22} className={unreadCount > 0 ? 'animate-swing' : ''} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 transition-all scale-110">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Placeholder */}
                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[70] animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                          알림 <span className="text-xs font-bold text-slate-400">Recent</span>
                        </h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-[11px] font-bold text-primary hover:underline"
                          >
                            모두 읽음
                          </button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            {notifications.map((noti) => {
                              // URL 정규화 함수
                              const normalizeUrl = (url: string) => {
                                if (!url) return '/';
                                if (url.includes('/board/view?boardId=')) {
                                  const boardId = url.split('boardId=')[1]?.split('&')[0];
                                  return `/exam/${boardId}?boardCode=S`; 
                                }
                                return url;
                              };

                              return (
                                <button
                                  key={noti.id}
                                  onClick={() => {
                                    if (noti.id && !noti.id.startsWith('noti_')) {
                                      markAsRead(noti.id);
                                    }
                                    navigate(normalizeUrl(noti.targetUrl));
                                    setIsNotificationOpen(false);
                                  }}
                                  className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 ${!noti.isRead ? 'bg-blue-50/30 dark:bg-primary/5' : ''}`}
                                >
                                  <div className={`size-8 rounded-full flex-shrink-0 flex items-center justify-center ${!noti.isRead ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    <Bell size={14} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-snug mb-1 ${!noti.isRead ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                      {noti.content}
                                    </p>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {noti.timestamp}
                                    </span>
                                  </div>
                                  {!noti.isRead && (
                                    <div className="size-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-12 text-center">
                            <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Bell size={20} className="text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-400">새로운 알림이 없습니다.</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
                        <Link 
                          to="/mypage" 
                          onClick={() => setIsNotificationOpen(false)}
                          className="text-xs font-bold text-slate-500 hover:text-primary transition-colors"
                        >
                          전체 알림 보기
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all group ${isProfileOpen ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                  <div className="size-8 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center text-primary border border-primary/10 font-black text-xs uppercase group-hover:scale-105 transition-transform shadow-sm">
                    {user.profileImage ? (
                      <img src={getProfileImageUrl(user.profileImage)!} alt="P" className="w-full h-full object-cover" />
                    ) : (
                      user.userName?.[0] || 'U'
                    )}
                  </div>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200 hidden sm:block">
                    {user.userName}
                  </span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                <ProfileDropdown 
                  isOpen={isProfileOpen} 
                  onClose={() => setIsProfileOpen(false)} 
                  onOpenPasswordReset={onOpenPasswordReset}
                  user={user} 
                  onLogout={logout} 
                  getText={getText} 
                  onOpenWithdrawalModal={() => setIsWithdrawalModalOpen(true)}
                />
              </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={onOpenLoginModal}
                  className="min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-slate-700 text-white text-sm font-bold shadow-md hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 transition-colors"
                >
                  <span>{getText('common.login')}</span>
                </button>
                <button
                  onClick={onOpenSignUpModal}
                  className="min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-md hover:bg-blue-600 transition-all"
                >
                  <span>{getText('common.signup')}</span>
                </button>
              </div>
            )}
            
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#0d141b] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Side Drawer */}
      <div className={`fixed inset-0 z-[100] lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div 
          ref={mobileMenuRef}
          className={`absolute top-0 right-0 w-72 h-full bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-primary flex items-center gap-2">
                <Database size={24} /> SQLD
              </h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleHeaderSearch} className="mb-8 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={headerKeyword}
                onChange={(e) => setHeaderKeyword(e.target.value)}
                className="w-full h-12 pl-10 pr-4 bg-slate-100 dark:bg-slate-800 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="빠른 검색..."
              />
            </form>

            <nav className="flex-1 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Navigation</p>
              {boardConfigs.filter(config => config.useYn === 'Y').map((config) => (
                <Link 
                  key={config.boardCode}
                  to={`/practice-exams?boardCode=${config.boardCode}`} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors font-bold ${
                    currentCode === config.boardCode
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {config.groupCode === 'G_BRD_NOTICE' ? <Megaphone size={18} className={currentCode === config.boardCode ? 'text-primary' : 'text-slate-400'} /> : 
                   config.groupCode === 'G_BRD_GREETING' ? <Smile size={18} className={currentCode === config.boardCode ? 'text-primary' : 'text-slate-400'} /> : 
                   <FileText size={18} className={(currentCode === config.boardCode || (!currentCode && config.groupCode === 'G_BRD_LICENSE' && location.pathname === '/practice-exams')) ? 'text-primary' : 'text-slate-400'} />}
                  {config.boardName}
                </Link>
              ))}
              
              {['ADMIN', 'SUPER_ADMIN'].includes(user?.userRole || '') && (
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest px-2 mb-2">Administrator</p>
                  <Link 
                    to="/admin/members" 
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors font-black ${
                      location.pathname === '/admin/members'
                      ? 'bg-red-50 text-red-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-red-500'
                    }`}
                  >
                    <ShieldCheck size={18} /> 회원 관리
                  </Link>
                </div>
              )}
            </nav>

            {!user && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <button onClick={() => { setIsMobileMenuOpen(false); onOpenLoginModal(); }} className="w-full h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-black text-sm transition-all">
                  {getText('common.login')}
                </button>
                <button onClick={() => { setIsMobileMenuOpen(false); onOpenSignUpModal(); }} className="w-full h-12 rounded-xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/20 transition-all">
                  {getText('common.signup')}
                </button>
              </div>
            )}

            {user && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => { setIsMobileMenuOpen(false); logout(); }} className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-red-500 font-black text-sm flex items-center justify-center gap-2">
                  <LogOut size={18} /> {getText('common.logout')}
                </button>
              </div>
            )}
          </div>
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
}
