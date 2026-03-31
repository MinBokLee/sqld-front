import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Bookmark, Trash2, Calendar, MessageSquare, Eye, ThumbsUp, 
  ChevronRight, CheckSquare, Square, Search, User, 
  ArrowLeft, AlertCircle, FileText, PenLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useAlert } from '../contexts/AlertContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { formatRelativeTime } from '../utils/dateUtils';
import api from '../utils/api';

/**
 * [MyPage.tsx]
 * @description 스크랩 관리 및 내가 쓴 글 등 회원 활동을 담당하는 마이페이지 컴포넌트입니다.
 */

interface BasePost {
  boardId: number;
  title: string;
  createAt: string;
  userName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  boardType: string;
}

interface ScrappedPost extends BasePost {
  scrapId: number;
}

interface MyPost extends BasePost {}

type TabType = 'scraps' | 'posts';

export default function MyPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

  // URL 파라미터에서 초기 탭 결정
  const initialTab = (searchParams.get('tab') as TabType) || 'scraps';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  
  const [scraps, setScraps] = useState<ScrappedPost[]>([]);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]); 
  const [searchKeyword, setSearchKeyword] = useState('');
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * [데이터 페칭] 스크랩 목록
   */
  const fetchScraps = useCallback(async (keyword: string = "") => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await api.get('/api/board/searchScrapMyPage', {
        params: { keyword: keyword.trim() },
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      });
      if (response.data.success) {
        setScraps(response.data.result?.data || []);
      }
    } catch (error) {
      console.error("Fetch scraps error:", error);
      showAlert({ type: 'error', message: "스크랩 목록을 불러오지 못했습니다. ⏳" });
    } finally {
      setLoading(false);
    }
  }, [user, showAlert]);

  /**
   * [데이터 페칭] 내가 쓴 글 목록
   */
  const fetchMyPosts = useCallback(async (keyword: string = "") => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await api.get('/api/board/my-list', {
        params: { 
          page: 1, 
          size: 100, 
          memberId: user.memberId,
          keyword: keyword.trim(),
          boardType: 'S'
        },
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      });
      if (response.data.success) {
        const list = response.data.result?.data?.list || response.data.result?.data || [];
        setMyPosts(list);
      }
    } catch (error) {
      console.error("Fetch my posts error:", error);
      showAlert({ type: 'error', message: "작성한 글 목록을 불러오지 못했습니다. ⏳" });
    } finally {
      setLoading(false);
    }
  }, [user, showAlert]);

  /**
   * [탭 전환] 상태 변경 + URL 업데이트 + 데이터 로드 트리거
   */
  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return; // 이미 활성화된 탭이면 무시
    
    setActiveTab(tab);
    setSearchParams({ tab }); // URL 파라미터 업데이트
    setSelectedIds([]);       // 선택된 아이템 초기화
    setSearchKeyword('');     // 검색어 초기화
    
    // 즉시 데이터 로드 (useEffect 의존성으로도 작동하지만 명시적 호출로 즉각성 확보)
    if (tab === 'scraps') fetchScraps("");
    else fetchMyPosts("");
  };

  // URL 파라미터 변경 감지 (브라우저 뒤로가기/앞으로가기 대응)
  useEffect(() => {
    const tabInUrl = searchParams.get('tab') as TabType;
    if (tabInUrl && tabInUrl !== activeTab) {
      setActiveTab(tabInUrl);
    }
  }, [searchParams]);

  // 초기 로드 및 인증 체크
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      showAlert({ type: 'warning', message: "로그인이 필요한 서비스입니다. ✅" });
      navigate('/');
      return;
    }
    // 초기 로딩 시 현재 탭에 맞는 데이터 페칭
    if (activeTab === 'scraps') fetchScraps("");
    else fetchMyPosts("");
  }, [user, isUserLoading, activeTab]); // activeTab을 의존성에 추가하여 탭 변경 시마다 자동 페칭

  /**
   * [검색 로직] 디바운싱 처리
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKeyword(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (activeTab === 'scraps') fetchScraps(value);
      else fetchMyPosts(value);
    }, 500);
  };

  /**
   * [선택 로직] 개별/전체 선택
   */
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const currentList = activeTab === 'scraps' ? scraps : myPosts;
    const currentIds = activeTab === 'scraps' ? scraps.map(s => s.scrapId) : myPosts.map(p => p.boardId);
    
    if (selectedIds.length === currentList.length && currentList.length > 0) setSelectedIds([]);
    else setSelectedIds(currentIds);
  };

  /**
   * [삭제 로직] 일괄 삭제 실행
   */
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0 || !user) return;
    
    const message = activeTab === 'scraps' 
      ? `선택한 ${selectedIds.length}개의 스크랩을 해제하시겠습니까?`
      : `선택한 ${selectedIds.length}개의 게시글을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 댓글과 첨부파일도 함께 삭제됩니다.`;

    if (!window.confirm(message)) return;

    try {
      if (activeTab === 'scraps') {
        const response = await api.delete('/api/board/deleteMyScrapPage', {
          data: { scrapIds: selectedIds },
          headers: { 'Authorization': `Bearer ${user.accessToken}` }
        });
        if (response.status === 200 || response.data.success) {
          showAlert({ type: 'success', message: "스크랩 해제 완료 ✅" });
          fetchScraps(searchKeyword); // 목록 갱신
        }
      } else {
        const response = await api.delete('/api/board/list/deleteBoardContent', {
          data: { boardIds: selectedIds },
          headers: { 'Authorization': `Bearer ${user.accessToken}` }
        });
        if (response.status === 200 || response.data.success) {
          showAlert({ type: 'success', message: "게시글 일괄 삭제 완료 ✅" });
          fetchMyPosts(searchKeyword); // 목록 갱신
        }
      }
      setSelectedIds([]);
    } catch (error) {
      console.error("Delete error:", error);
      showAlert({ type: 'error', message: "삭제 처리 중 오류가 발생했습니다. ⏳" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] transition-colors pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a222c] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"><ArrowLeft size={16} /> 홈으로 돌아가기</Link>
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-sm"><User size={32} /></div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">마이페이지</h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">활동 내역과 게시글을 효율적으로 관리하세요.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-6 py-3 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-0.5">{activeTab === 'scraps' ? 'Total Scraps' : 'My Posts'}</p>
                <div className="flex items-center gap-2">
                  {activeTab === 'scraps' ? <Bookmark size={14} className="text-primary" /> : <FileText size={14} className="text-primary" />}
                  <span className="text-sm font-black text-primary">{activeTab === 'scraps' ? scraps.length : myPosts.length}건</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Tabs - 수정된 handleTabChange 적용 */}
          <aside className="lg:col-span-3 space-y-2">
            <button 
              onClick={() => handleTabChange('scraps')} 
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black transition-all ${activeTab === 'scraps' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-white dark:bg-[#1a222c] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'}`}
            >
              <Bookmark size={20} /> 스크랩 관리
            </button>
            <button 
              onClick={() => handleTabChange('posts')} 
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black transition-all ${activeTab === 'posts' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-white dark:bg-[#1a222c] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'}`}
            >
              <PenLine size={20} /> 내가 쓴 글 관리
            </button>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#1a222c] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button onClick={toggleSelectAll} className="flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                  {selectedIds.length === (activeTab === 'scraps' ? scraps.length : myPosts.length) && (activeTab === 'scraps' ? scraps.length : myPosts.length) > 0 ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
                  전체 선택
                </button>
                <AnimatePresence>
                  {selectedIds.length > 0 && (
                    <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onClick={handleDeleteSelected} className="flex items-center gap-2 px-4 py-2 text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-xl hover:bg-rose-100 transition-all shadow-sm">
                      <Trash2 size={16} /> {selectedIds.length}개 {activeTab === 'scraps' ? '해제' : '삭제'}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative w-full sm:w-64 group">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${loading && searchKeyword ? 'text-primary animate-pulse' : 'text-slate-400'}`} size={16} />
                <input type="text" placeholder={`${activeTab === 'scraps' ? '스크랩' : '작성 글'} 내역 검색...`} value={searchKeyword} onChange={handleSearchChange} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a222c] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Loading Data...</p>
                </div>
              ) : (activeTab === 'scraps' ? scraps.length > 0 : myPosts.length > 0) ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(activeTab === 'scraps' ? scraps : myPosts).map((item) => (
                    <motion.div key={activeTab === 'scraps' ? (item as ScrappedPost).scrapId : item.boardId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`group relative flex items-center gap-4 p-4 sm:p-5 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${selectedIds.includes(activeTab === 'scraps' ? (item as ScrappedPost).scrapId : item.boardId) ? 'bg-primary/5' : ''}`}>
                      <button onClick={() => toggleSelect(activeTab === 'scraps' ? (item as ScrappedPost).scrapId : item.boardId)} className={`flex-shrink-0 transition-colors z-10 ${selectedIds.includes(activeTab === 'scraps' ? (item as ScrappedPost).scrapId : item.boardId) ? 'text-primary' : 'text-slate-300 dark:text-slate-700 hover:text-slate-400'}`}>
                        {selectedIds.includes(activeTab === 'scraps' ? (item as ScrappedPost).scrapId : item.boardId) ? <CheckSquare size={22} /> : <Square size={22} />}
                      </button>
                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-tighter ${item.boardType === 'N' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-primary/10 text-primary'}`}>{item.boardType === 'S' ? 'SQLD Study' : item.boardType === 'N' ? 'Notice' : 'Community'}</span>
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Calendar size={10} /> {formatRelativeTime(item.createAt)}</span>
                          </div>
                          <Link to={`/exam/${item.boardId}?type=${item.boardType}`} className="text-sm sm:text-base font-black text-slate-800 dark:text-white hover:text-primary transition-colors line-clamp-1 block mb-1">{item.title}</Link>
                        </div>
                        <div className="hidden sm:flex items-center gap-6 text-slate-400 font-bold text-xs flex-shrink-0">
                          <div className="flex items-center gap-4 w-32 justify-end">
                            <span className="flex items-center gap-1 min-w-[30px]"><Eye size={13} /> {item.viewCount}</span>
                            <span className="flex items-center gap-1 text-primary min-w-[30px]"><MessageSquare size={13} /> {item.commentCount}</span>
                            <span className="flex items-center gap-1 text-rose-500 min-w-[30px]"><ThumbsUp size={13} /> {item.likeCount}</span>
                          </div>
                          <Link to={`/exam/${item.boardId}?type=${item.boardType}`} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all group-hover:translate-x-1"><ChevronRight size={18} /></Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-32 flex flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-500">
                  <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">{activeTab === 'scraps' ? <Bookmark size={40} /> : <PenLine size={40} />}</div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{searchKeyword ? '검색 결과가 없습니다.' : activeTab === 'scraps' ? '스크랩한 글이 없습니다.' : '작성한 글이 없습니다.'}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{searchKeyword ? '다른 키워드로 검색해 보시겠어요? 🔍' : '새로운 활동을 시작해 보세요! ✨'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
