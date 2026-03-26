import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bookmark, Trash2, Calendar, MessageSquare, Eye, ThumbsUp, 
  ChevronRight, CheckSquare, Square, Search, User, Shield, 
  ArrowLeft, LayoutGrid, List as ListIcon, Filter, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useAlert } from '../contexts/AlertContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { formatRelativeTime } from '../utils/dateUtils';
import api from '../utils/api';

/**
 * [MyPage.tsx]
 * @description 스크랩 관리 및 회원 활동을 담당하는 마이페이지 컴포넌트입니다.
 */

interface ScrappedPost {
  boardId: number;
  scrapId: number;
  title: string;
  createAt: string;
  userName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  boardType: string;
  tagName?: string;
}

export default function MyPage() {
  const { user, isLoading } = useUser();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

  const [activeTab, setActiveTab] = useState<'scraps'>('scraps');
  const [scraps, setScraps] = useState<ScrappedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 스크랩 목록 가져오기 (서버측 검색 및 null 처리 완벽 반영)
  const fetchScraps = useCallback(async (keyword: string = "") => {
    if (!user) return;
    setLoading(true);
    try {
      // [수정] null 대신 빈 문자열을 사용하여 파라미터 생략 방지
      const response = await api.get('/api/board/searchScrapMyPage', {
        params: { 
          keyword: keyword.trim() 
        },
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      });
      if (response.data.success) {
        setScraps(response.data.result?.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch scraps:", error);
      showAlert({ type: 'error', message: "스크랩 목록을 불러오는 데 실패했습니다. ⏳" });
    } finally {
      setLoading(false);
    }
  }, [user, showAlert]);

  // 초기 로드 및 인증 체크
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      showAlert({ type: 'warning', message: "로그인이 필요한 서비스입니다. ✅" });
      navigate('/');
      return;
    }
    fetchScraps(""); // 초기 조회 시 빈 문자열 전달 (내부에서 null 처리됨)
  }, [user, isLoading, navigate, showAlert, fetchScraps]);

  // 검색어 입력 시 디바운싱 처리
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKeyword(value);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(() => {
      fetchScraps(value);
    }, 500);
  };

  // 엔터 키 즉시 검색
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmedKeyword = searchKeyword.trim();
      
      // 유효성 검사: 검색어가 없는 경우 알림창 출력 (일관성 유지)
      if (!trimmedKeyword) {
        showAlert({ 
          type: 'warning', 
          message: "키워드를 입력해 주세요. ⚠️ 검색어 없이 조회를 진행할 수 없습니다." 
        });
        return;
      }

      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      fetchScraps(trimmedKeyword);
    }
  };

  // 체크박스 선택 토글
  const toggleSelect = (scrapId: number) => {
    setSelectedIds(prev => 
      prev.includes(scrapId) ? prev.filter(id => id !== scrapId) : [...prev, scrapId]
    );
  };

  // 전체 선택 토글
  const toggleSelectAll = () => {
    if (selectedIds.length === scraps.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(scraps.map(s => s.scrapId));
    }
  };

  // 선택된 스크랩 삭제 (다중 삭제)
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`선택한 ${selectedIds.length}개의 스크랩을 해제하시겠습니까?`)) return;

    try {
      const response = await api.delete('/api/board/deleteMyScrapPage', {
        data: { scrapIds: selectedIds },
        headers: { 'Authorization': `Bearer ${user?.accessToken}` }
      });

      if (response.status === 200 || response.data.success) {
        showAlert({ type: 'success', message: "스크랩이 성공적으로 해제되었습니다. ✅" });
        setScraps(prev => prev.filter(s => !selectedIds.includes(s.scrapId)));
        setSelectedIds([]);
      }
    } catch (error) {
      console.error("Delete scraps error:", error);
      showAlert({ type: 'error', message: "삭제 중 오류가 발생했습니다. ⏳" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] transition-colors pb-20">
      {/* Header Section */}
      <div className="bg-white dark:bg-[#1a222c] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                <ArrowLeft size={16} /> 홈으로 돌아가기
              </Link>
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-sm">
                  <User size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">마이페이지</h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">활동 내역과 스크랩한 학습 자료를 관리하세요.</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-6 py-3 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-0.5">총 스크랩</p>
                <div className="flex items-center gap-2">
                  <Bookmark size={14} className="text-primary" />
                  <span className="text-sm font-black text-primary">{scraps.length}건</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Tabs */}
          <aside className="lg:col-span-3 space-y-2">
            <button 
              onClick={() => setActiveTab('scraps')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black transition-all ${activeTab === 'scraps' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-white dark:bg-[#1a222c] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'}`}
            >
              <Bookmark size={20} />
              스크랩 관리
            </button>
            <div className="p-6 bg-slate-200/30 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center mt-6">
              <AlertCircle size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed">활동 통계 및 내가 쓴 글 <br/>기능은 곧 업데이트됩니다! 🚀</p>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#1a222c] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button 
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  {selectedIds.length === scraps.length && scraps.length > 0 ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
                  전체 선택
                </button>
                <AnimatePresence>
                  {selectedIds.length > 0 && (
                    <motion.button 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onClick={handleDeleteSelected}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-xl hover:bg-rose-100 transition-all shadow-sm"
                    >
                      <Trash2 size={16} />
                      {selectedIds.length}개 삭제
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative w-full sm:w-64 group">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${loading && searchKeyword ? 'text-primary animate-pulse' : 'text-slate-400'}`} size={16} />
                <input 
                  type="text" 
                  placeholder="스크랩 내역 검색..."
                  value={searchKeyword}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Scraps List */}
            <div className="bg-white dark:bg-[#1a222c] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {loading && scraps.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Searching Scraps</p>
                </div>
              ) : scraps.length > 0 ? (
                <div className={`divide-y divide-slate-100 dark:divide-slate-800 ${loading ? 'opacity-50 pointer-events-none' : 'transition-opacity'}`}>
                  {scraps.map((scrap) => (
                    <motion.div 
                      key={scrap.scrapId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group relative flex items-center gap-4 p-4 sm:p-5 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${selectedIds.includes(scrap.scrapId) ? 'bg-primary/5' : ''}`}
                    >
                      {/* Checkbox */}
                      <button 
                        onClick={() => toggleSelect(scrap.scrapId)}
                        className={`flex-shrink-0 transition-colors z-10 ${selectedIds.includes(scrap.scrapId) ? 'text-primary' : 'text-slate-300 dark:text-slate-700 hover:text-slate-400'}`}
                      >
                        {selectedIds.includes(scrap.scrapId) ? <CheckSquare size={22} /> : <Square size={22} />}
                      </button>

                      {/* Content Section */}
                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-tighter ${
                              scrap.boardType === 'N' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 
                              scrap.boardType === 'S' ? 'bg-primary/10 text-primary dark:bg-primary/20' : 
                              'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}>
                              {scrap.boardType === 'S' ? 'SQLD Study' : scrap.boardType === 'N' ? 'Notice' : 'Community'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <Calendar size={10} /> {formatRelativeTime(scrap.createAt)}
                            </span>
                          </div>
                          <Link 
                            to={`/exam/${scrap.boardId}?type=${scrap.boardType}`}
                            className="text-sm sm:text-base font-black text-slate-800 dark:text-white hover:text-primary transition-colors line-clamp-1 block mb-1"
                          >
                            {scrap.title}
                          </Link>
                          <div className="flex items-center gap-3 text-slate-400 font-bold text-[11px] sm:hidden">
                            <span className="flex items-center gap-1 truncate max-w-[80px]"><User size={12} /> {scrap.userName}</span>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1"><Eye size={12} /> {scrap.viewCount}</span>
                              <span className="flex items-center gap-1 text-primary"><MessageSquare size={12} /> {scrap.commentCount}</span>
                              <span className="flex items-center gap-1 text-rose-500"><ThumbsUp size={12} /> {scrap.likeCount}</span>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Metadata */}
                        <div className="hidden sm:flex items-center gap-6 text-slate-400 font-bold text-xs flex-shrink-0">
                          <span className="w-24 truncate text-right flex items-center justify-end gap-1.5"><User size={13} className="text-slate-300" /> {scrap.userName}</span>
                          <div className="flex items-center gap-4 w-32 justify-end">
                            <span className="flex items-center gap-1 min-w-[30px]"><Eye size={13} /> {scrap.viewCount}</span>
                            <span className="flex items-center gap-1 text-primary min-w-[30px]"><MessageSquare size={13} /> {scrap.commentCount}</span>
                            <span className="flex items-center gap-1 text-rose-500 min-w-[30px]"><ThumbsUp size={13} /> {scrap.likeCount}</span>
                          </div>
                          <Link 
                            to={`/exam/${scrap.boardId}?type=${scrap.boardType}`}
                            className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all group-hover:translate-x-1"
                          >
                            <ChevronRight size={18} />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-32 flex flex-col items-center justify-center gap-6 text-center">
                  <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                    <Bookmark size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{searchKeyword ? '검색 결과가 없습니다.' : '스크랩한 글이 없습니다.'}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{searchKeyword ? '다른 검색어를 입력해 보세요! 🔍' : '유용한 정보를 발견하면 스크랩해 보세요! ✨'}</p>
                  </div>
                  {!searchKeyword && (
                    <Link to="/practice-exams?type=S" className="px-8 py-3 bg-primary text-white font-black rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 active:scale-95">
                      학습 게시판으로 이동
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
