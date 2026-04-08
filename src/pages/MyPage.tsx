import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  User, Mail, Calendar, Settings, 
  ChevronRight, Bookmark, FileText, 
  Trash2, MessageSquare, Eye, ThumbsUp,
  Search, Filter, Clock, MoreVertical,
  CheckCircle2, AlertCircle, ChevronsRight,
  ChevronLeft, ChevronsLeft, ChevronRight as ChevronRightIcon, ChevronsRight as ChevronsRightIcon
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useAlert } from '../contexts/AlertContext';
import api from '../utils/api';
import { formatRelativeTime } from '../utils/dateUtils';

interface ScrapItem {
  scrapId: number;
  boardId: number;
  title: string;
  createAt: string;
  userName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  boardType: string;
}

interface MyPostItem {
  boardId: number;
  title: string;
  createAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  boardType: string;
  seqNumber?: number;
}

export default function MyPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { showAlert, showToast } = useAlert();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 탭 및 필터 상태
  const activeTab = searchParams.get('tab') || 'scraps';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const size = 10;
  const keyword = searchParams.get('keyword') || '';
  const boardFilter = searchParams.get('filter') || 'ALL'; // 전체, 공지, 학습, 가입인사

  const [inputKeyword, setInputKeyword] = useState(keyword);
  const [scraps, setScraps] = useState<ScrapItem[]>([]);
  const [myPosts, setMyPosts] = useState<MyPostItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchScraps = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await api.get('/api/board/searchScrapMyPage', {
        params: {
          memberId: user.memberId,
          page,
          size,
          keyword,
          boardType: boardFilter === 'ALL' ? '' : boardFilter
        }
      });
      if (response.data.success) {
        setScraps(response.data.result.data.list || []);
        setTotalElements(response.data.result.data.total || 0);
      } else {
        showAlert({ type: 'error', message: "스크랩 목록을 불러오지 못했습니다." });
      }
    } catch (error) {
      console.error("Fetch scraps error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, page, keyword, boardFilter, showAlert]);

  const fetchMyPosts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await api.get('/api/board/my-list', {
        params: {
          memberId: user.memberId,
          page,
          size,
          keyword,
          boardType: boardFilter === 'ALL' ? '' : boardFilter
        }
      });
      if (response.data.success) {
        setMyPosts(response.data.result.data.list || []);
        setTotalElements(response.data.result.data.total || 0);
      } else {
        showAlert({ type: 'error', message: "내 글 목록을 불러오지 못했습니다." });
      }
    } catch (error) {
      console.error("Fetch posts error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, page, keyword, boardFilter, showAlert]);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      showAlert({ type: 'warning', message: "로그인이 필요한 페이지입니다. 🔒" });
      navigate('/');
      return;
    }

    if (activeTab === 'scraps') fetchScraps();
    else fetchMyPosts();
  }, [user, isUserLoading, activeTab, page, size, keyword, boardFilter, fetchScraps, fetchMyPosts, navigate, showAlert]);

  const toggleTab = (tab: string) => {
    setSearchParams({ tab, page: '1', keyword, filter: boardFilter });
    setSelectedIds([]);
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ tab: activeTab, page: String(newPage), keyword, filter: boardFilter });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputKeyword(e.target.value);
  };

  const handleSearch = () => {
    setSearchParams({ tab: activeTab, page: '1', keyword: inputKeyword, filter: boardFilter });
  };

  const setBoardFilter = (filter: string) => {
    setSearchParams({ tab: activeTab, page: '1', keyword, filter });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentIds = activeTab === 'scraps' 
      ? scraps.map(s => s.scrapId) 
      : myPosts.map(p => p.boardId);
    
    if (selectedIds.length === currentIds.length) setSelectedIds([]);
    else setSelectedIds(currentIds);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      if (activeTab === 'scraps') {
        await api.delete('/api/board/deleteMyScrapPage', { 
          data: { scrapIds: selectedIds }, 
          headers: { 'Authorization': `Bearer ${user?.accessToken}` } 
        });
      } else {
        // 일괄 삭제 API가 없는 경우 개별 삭제 루프
        for (const id of selectedIds) {
          await api.delete(`/api/board/list/${id}`, { headers: { 'Authorization': `Bearer ${user?.accessToken}` } });
        }
      }
      showToast("정상적으로 처리되었습니다. ✅");
      setSelectedIds([]);
      if (activeTab === 'scraps') fetchScraps();
      else fetchMyPosts();
    } catch (error) { 
      showAlert({ type: 'error', message: "처리에 실패했습니다. ⏳" }); 
    }
  };

  const totalPages = Math.ceil(totalElements / size);
  const pageRange = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] text-slate-900 dark:text-white transition-colors py-10 px-4 sm:px-6 lg:px-8">
      <main className="max-w-[1280px] mx-auto">
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4 font-bold">
              <Link to="/" className="hover:text-primary transition-colors">홈</Link>
              <ChevronsRight size={14} />
              <span>마이페이지</span>
            </nav>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              활동 내역 <span className="text-primary text-xl">({totalElements})</span>
            </h1>
          </div>

          <div className="flex bg-white dark:bg-[#1a222c] p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 w-fit">
            <button onClick={() => toggleTab('scraps')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'scraps' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>스크랩 목록</button>
            <button onClick={() => toggleTab('posts')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'posts' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>내가 쓴 글</button>
          </div>
        </header>

        {/* Filter & Action Section */}
        <section className="flex flex-col xl:flex-row gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <button onClick={handleSelectAll} className="flex items-center gap-2 h-12 px-4 bg-white dark:bg-[#1a222c] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black text-slate-500 dark:text-slate-400 hover:text-primary transition-all shadow-sm">
                  {selectedIds.length === (activeTab === 'scraps' ? scraps.length : myPosts.length) ? '선택 해제' : '전체 선택'}
                </button>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
                <button onClick={handleDeleteSelected} className="flex items-center gap-2 h-12 px-6 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl text-xs font-black hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={14} /> {selectedIds.length}개 삭제</button>
              </div>
            )}
            
            <div className="flex bg-white dark:bg-[#1a222c] p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-12">
              {['ALL', 'N', 'S', 'G'].map(f => (
                <button key={f} onClick={() => { setBoardFilter(f); handlePageChange(1); }} className={`px-6 h-full rounded-xl text-xs font-black transition-all ${boardFilter === f ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                  {f === 'ALL' ? '전체' : f === 'N' ? '공지' : f === 'S' ? '학습' : '인사'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-[#1a222c] p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none flex items-center group focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/40 transition-all duration-300 h-12">
            <div className="w-10 h-10 flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="제목이나 내용에서 검색..." 
              className="w-full bg-transparent border-none py-2 text-[15px] font-semibold outline-none focus:ring-0 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600" 
              value={inputKeyword} 
              onChange={handleSearchChange} 
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="bg-primary text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-blue-600 transition-all shadow-md active:scale-90 shrink-0 ml-2" onClick={handleSearch} title="검색"><ChevronsRight size={18} /></button>
          </div>
        </section>

        {/* List Section */}
        <div className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[#4c739a] dark:text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 text-center w-16">
                    <input type="checkbox" className="rounded-md border-slate-300 text-primary focus:ring-primary cursor-pointer" checked={selectedIds.length > 0 && selectedIds.length === (activeTab === 'scraps' ? scraps.length : myPosts.length)} onChange={handleSelectAll} />
                  </th>
                  <th className="px-6 py-5 text-center w-20">No</th>
                  <th className="px-6 py-5 text-left">제목</th>
                  {activeTab === 'scraps' && <th className="px-6 py-5 text-center w-24">작성자</th>}
                  <th className="px-6 py-5 text-center w-32">날짜</th>
                  <th className="px-6 py-5 text-center w-20">조회</th>
                  <th className="px-6 py-5 text-center w-20">추천</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-sm font-bold text-slate-400">데이터를 불러오는 중입니다...</p>
                    </td>
                  </tr>
                ) : (activeTab === 'scraps' ? scraps : myPosts).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="text-slate-300" size={32} />
                      </div>
                      <p className="text-sm font-bold text-slate-400">활동 내역이 없습니다.</p>
                    </td>
                  </tr>
                ) : (
                  (activeTab === 'scraps' ? scraps : myPosts).map((post, idx) => {
                    const id = activeTab === 'scraps' ? post.scrapId : post.boardId;
                    return (
                      <tr key={id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => navigate(`/exam/${post.boardId}?type=${post.boardType}`)}>
                        <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="rounded-md border-slate-300 text-primary focus:ring-primary cursor-pointer" checked={selectedIds.includes(id)} onChange={() => toggleSelect(id)} />
                        </td>
                        <td className="px-6 py-5 text-sm text-[#4c739a] text-center font-bold whitespace-nowrap">
                          {activeTab === 'posts' && typeof post.seqNumber === 'number' ? String(post.seqNumber).padStart(2, '0') : totalElements - (page-1)*size - idx}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${post.boardType === 'N' ? 'bg-amber-100 text-amber-600' : post.boardType === 'S' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {post.boardType === 'N' ? 'Notice' : post.boardType === 'S' ? 'Study' : 'Join'}
                              </span>
                              <h3 className="text-sm font-bold text-[#0d141b] dark:text-white group-hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-[400px]">{post.title}</h3>
                              {post.commentCount > 0 && <span className="text-primary font-black text-[11px] shrink-0">[{post.commentCount}]</span>}
                            </div>
                          </div>
                        </td>
                        {activeTab === 'scraps' && (
                          <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400 text-center font-medium whitespace-nowrap">{(post as ScrapItem).userName}</td>
                        )}
                        <td className="px-6 py-5 text-sm text-[#4c739a] dark:text-slate-400 text-center whitespace-nowrap">{formatRelativeTime(post.createAt)}</td>
                        <td className="px-6 py-5 text-sm text-[#4c739a] dark:text-slate-400 text-center font-bold">{post.viewCount}</td>
                        <td className="px-6 py-5 text-sm text-[#4c739a] dark:text-slate-400 text-center font-bold">{post.likeCount}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center items-center gap-2">
            <button onClick={() => handlePageChange(1)} disabled={page === 1} className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a222c] text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"><ChevronsLeft size={18} /></button>
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a222c] text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"><ChevronLeft size={18} /></button>
            
            {pageRange.map(p => (
              <button key={p} onClick={() => handlePageChange(p)} className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm transition-all ${p === page ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-110' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{p}</button>
            ))}

            <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a222c] text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"><ChevronRightIcon size={18} /></button>
            <button onClick={() => handlePageChange(totalPages)} disabled={page === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a222c] text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"><ChevronsRightIcon size={18} /></button>
          </div>
        )}
      </main>
    </div>
  );
}
