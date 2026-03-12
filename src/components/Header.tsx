import { Database, Menu, Search, User as UserIcon, ChevronDown, ShieldCheck, X, LogOut, FileText, Smile, Megaphone } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useState, useRef, useEffect } from 'react';
import ProfileDropdown from './ProfileDropdown';

// const API_BASE_URL = "http://localhost:8881";

interface HeaderProps {
  onOpenSignUpModal: () => void;
  onOpenLoginModal: () => void;
  onOpenPasswordReset: () => void;
  getText: (key: string) => string;
}

export default function Header({ onOpenSignUpModal, onOpenLoginModal, onOpenPasswordReset, getText }: HeaderProps) {
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile Menu State
  const [headerKeyword, setHeaderKeyword] = useState(''); 
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const searchParams = new URLSearchParams(location.search);
  const currentType = searchParams.get('type');
  
  const isTargetPage = ['/practice-exams', '/exam', '/write-post'].some(path => location.pathname.startsWith(path));

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // Close menus when route changes
  useEffect(() => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerKeyword.trim()) {
      navigate(`/practice-exams?type=S&page=1&keyword=${encodeURIComponent(headerKeyword.trim())}`);
      setHeaderKeyword('');
      setIsMobileMenuOpen(false);
    }
  };

  const getMenuClass = (type: string | null) => {
    const isActive = isTargetPage && currentType === type;
    const isStudyActive = isTargetPage && (
      (currentType === 'S') || 
      (location.pathname === '/practice-exams' && !currentType && type === 'S')
    );
    
    const activeClass = "text-primary dark:text-primary";
    const inactiveClass = "text-[#4c739a] hover:text-primary dark:text-slate-400 dark:hover:text-primary";
    
    if (type === 'S') return isStudyActive ? activeClass : inactiveClass;
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
          {/* Logo & Main Nav */}
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
              <Link to="/practice-exams?type=N" className={`${getMenuClass('N')} text-sm font-semibold transition-colors`}>
                {getText('board.notice')}
              </Link>
              <Link to="/practice-exams?type=S" className={`${getMenuClass('S')} text-sm font-semibold transition-colors`}>
                {getText('board.sqld_study')}
              </Link>
              <Link to="/practice-exams?type=G" className={`${getMenuClass('G')} text-sm font-semibold transition-colors`}>
                {getText('board.join_greetings')}
              </Link>
              {user?.userRole === 'ADMIN' && (
                <Link to="/admin/members" className="text-red-500 hover:text-red-600 text-sm font-black transition-colors flex items-center gap-1">
                  <ShieldCheck size={16} /> 회원 관리
                </Link>
              )}
            </nav>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="flex-1 max-w-md hidden md:block">
            <form onSubmit={handleHeaderSearch} className="relative flex items-center">
              <div className="absolute left-3 text-[#4c739a] pointer-events-none">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={headerKeyword}
                onChange={(e) => setHeaderKeyword(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border-none bg-[#e7edf3] dark:bg-slate-800 text-[#0d141b] dark:text-white placeholder:text-[#4c739a] focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                placeholder={getText('quick_search.placeholder')}
              />
            </form>
          </div>

          {/* Auth & Profile */}
          <div className="flex items-center gap-2">
            {user ? (
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
                />
              </div>
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
            
            {/* Mobile Menu Trigger */}
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

            {/* Mobile Search */}
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
              <Link 
                to="/practice-exams?type=N" 
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors font-bold ${
                  currentType === 'N' 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Megaphone size={18} className={currentType === 'N' ? 'text-primary' : 'text-slate-400'} /> {getText('board.notice')}
              </Link>
              <Link 
                to="/practice-exams?type=S" 
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors font-bold ${
                  (currentType === 'S' || (!currentType && location.pathname === '/practice-exams'))
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <FileText size={18} className={(currentType === 'S' || (!currentType && location.pathname === '/practice-exams')) ? 'text-primary' : 'text-slate-400'} /> {getText('board.sqld_study')}
              </Link>
              <Link 
                to="/practice-exams?type=G" 
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors font-bold ${
                  currentType === 'G' 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Smile size={18} className={currentType === 'G' ? 'text-primary' : 'text-slate-400'} /> {getText('board.join_greetings')}
              </Link>
              
              {user?.userRole === 'ADMIN' && (
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
    </>
  );
}
