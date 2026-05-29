import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MessageSquare, Eye, ThumbsUp, Clock, BookOpen,
  ArrowUpRight, PenSquare, Hash, Tag, X, TrendingUp, Heart,
  Layers, MessageCircle, Lightbulb, HelpCircle, User, ArrowUpDown
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { useAlert } from '../contexts/AlertContext';
import { useBoard } from '../contexts/BoardContext';
import { formatRelativeTime } from '../utils/dateUtils';
import api, { type BoardMaster, type CommonCodeDetail } from '../utils/api';

/**
 * [PracticeExams.tsx]
 * @description 서비스의 메인 게시판 목록 페이지 및 내 활동 관리 페이지입니다. 
 * 백엔드 통합 응답 규격({success, data, msg})을 100% 지원합니다.
 */

interface Post {
  id: number;
  title: string;
  author: string;
  authorImage?: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  boardCode: string;
  categoryId: string;
  tags?: string[];
  seqNumber?: number;
}

interface PopularPost {
  id: number;
  title: string;
  date: string;
  views: number;
  likeCount: number;
}

export default function PracticeExams() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { showAlert, showToast } = useAlert();
  const { getBoardConfig, getBoardCode, getBoardCategories, isLoading: isBoardConfigLoading } = useBoard();
  const [searchParams, setSearchParams] = useSearchParams();
  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

  const boardCode = searchParams.get('boardCode') 
    ? (['N', 'S', 'G'].includes(searchParams.get('boardCode')!) 
        ? (searchParams.get('boardCode') === 'N' ? getBoardCode('G_BRD_NOTICE') : searchParams.get('boardCode') === 'S' ? getBoardCode('G_BRD_LICENSE') : getBoardCode('G_BRD_GREETING'))
        : searchParams.get('boardCode'))
    : getBoardCode('G_BRD_LICENSE');
           
  const categoryId = searchParams.get('categoryId') || '';    
  const page = parseInt(searchParams.get('page') || '1'); 
  const size = parseInt(searchParams.get('size') || '10'); 
  const searchQuery = searchParams.get('keyword') || ''; 
  const tagNameFilter = searchParams.get('tagName') || ''; 
  const mode = searchParams.get('mode') || ''; 

  const [posts, setPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]);
  const boardConfig = getBoardConfig(boardCode);
  const categories = getBoardCategories(boardCode);
  const [totalPages, setTotalPages] = useState(1);
              
  const [isLoading, setIsLoading] = useState(true);             
  const [readPosts, setReadPosts] = useState<number[]>([]);     
  const [trendingTags, setTrendingTags] = useState<string[]>([]); 
  const [inputKeyword, setInputKeyword] = useState(searchQuery); 
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const lastFetchedParamsRef = useRef({ boardCode, categoryId, page, mode });

  const isDataStale = 
    lastFetchedParamsRef.current.boardCode !== boardCode || 
    lastFetchedParamsRef.current.categoryId !== categoryId || 
    lastFetchedParamsRef.current.page !== page ||
    lastFetchedParamsRef.current.mode !== mode;

  useEffect(() => {
    setInputKeyword(searchQuery);
  }, [searchQuery]);

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = e.target.value;
    const params = new URLSearchParams(searchParams);
    params.set('size', newSize);
    params.set('page', '1'); 
    setSearchParams(params);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputKeyword(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value.trim()) params.set('keyword', value.trim());
      else params.delete('keyword');
      params.set('page', '1');
      setSearchParams(params);
    }, 500);
  };

  const handleSearch = useCallback(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const trimmedKeyword = inputKeyword.trim();
    if (!trimmedKeyword) {
      showToast("키워드를 입력해 주세요. ⚠️", 'warning');
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.set('keyword', trimmedKeyword);
    params.set('page', '1');
    setSearchParams(params);
  }, [inputKeyword, searchParams, setSearchParams, showToast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      handleSearch();
    }
  };

  const fetchPopularPosts = useCallback(async () => {
    try {
      const data = await api.get(`/api/board/popularBoards`);
      setPopularPosts((data || []).map((item: any) => ({
        id: item.boardId,
        title: item.title,
        date: item.createAt,
        views: item.viewCount || 0,
        likeCount: item.likeCount || 0,
      })));
    } catch (error) { console.error(error); }
  }, []);

  const fetchTrendingTags = useCallback(async () => {
    try {
      const data = await api.get(`/api/board/list/paging`, { params: { page: 1, size: 30 } });
      const list = data?.list || [];
      const allTags = list.flatMap((p: any) => (p.tags && p.tags.length > 0) ? p.tags : (p.tagName ? p.tagName.split(',').map((t: string) => t.trim()) : []));
      const tagCounts: { [key: string]: number } = {};
      allTags.filter((t: string) => t).forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
      setTrendingTags(Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]).slice(0, 12));
    } catch (error) { console.error(error); }
  }, []);

  const fetchPosts = useCallback(async () => {
    if (isBoardConfigLoading || !boardCode) return;
    setPosts([]); 
    setIsLoading(true);
    try {
      const isMyMode = mode === 'my';
      let endpoint = '';
      let params: any = { page, size };

      if (searchQuery.trim() && !isMyMode) {
        endpoint = '/api/board/searchContent';
        params.keyword = searchQuery.trim();
        params.boardCode = boardCode;
      } else if (isMyMode) {
        endpoint = '/api/board/my-list';
        params.keyword = searchQuery.trim();
        params.boardCode = boardCode; 
      } else {
        endpoint = '/api/board/list/paging';
        params.boardCode = boardCode;
        if (categoryId) params.categoryId = categoryId;
        params.tagName = tagNameFilter || undefined;
      }
      
      const data = await api.get(endpoint, { params });
      const list = data?.list || [];
      
      setPosts(list.map((item: any) => ({
        id: item.boardId, title: item.title, author: item.userName, authorImage: item.profileImage,
        date: item.createAt, views: item.viewCount, likes: item.likeCount, comments: item.commentCount,
        boardCode: item.boardCode, categoryId: item.categoryId, categoryName: item.categoryName,
        tags: (item.tags && item.tags.length > 0) ? item.tags : (item.tagName ? item.tagName.split(',').map((t: string) => t.trim()) : []),
        seqNumber: item.seqNumber
      })));

      // [핵심] totalPage 정보 보정 로직
      const serverTotalPage = data?.totalPage || data?.totalPages || 0;
      if (serverTotalPage > 0) {
        setTotalPages(serverTotalPage);
      } else {
        // 서버에서 총 페이지 정보를 주지 않는 경우 (예: my-list)
        // 현재 불러온 데이터가 요청한 size(10개)와 같다면 다음 페이지가 더 있을 것으로 판단하여 UI를 활성화합니다.
        const hasNextPage = list.length === size;
        setTotalPages(hasNextPage ? page + 1 : page);
      }

      lastFetchedParamsRef.current = { boardCode, categoryId, page, mode };
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  }, [boardCode, categoryId, page, size, searchQuery, tagNameFilter, mode, isBoardConfigLoading]); 

  useEffect(() => {
    if (!isBoardConfigLoading) {
      fetchPosts();
      fetchPopularPosts();
      fetchTrendingTags();
    }
  }, [fetchPosts, fetchPopularPosts, fetchTrendingTags, isBoardConfigLoading]);

  useEffect(() => {
    const saved = localStorage.getItem('readPosts');
    if (saved) { try { setReadPosts(JSON.parse(saved)); } catch (e) { console.error(e); } }
  }, []);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostClick = (postId: number) => {
    const newReadPosts = Array.from(new Set([postId, ...readPosts])).slice(0, 500);
    setReadPosts(newReadPosts);
    localStorage.setItem('readPosts', JSON.stringify(newReadPosts));
  };

  const handleTagClick = (tag: string) => {
    navigate(`/practice-exams?boardCode=${encodeURIComponent(getBoardCode('G_BRD_LICENSE') || 'S')}&tagName=${encodeURIComponent(tag)}&page=1`);
  };

  const clearTagFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('tagName');
    params.set('page', '1');
    setSearchParams(params);
  };

  const getCustomDateDisplay = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    if (diffInHours < 24) return formatRelativeTime(dateString); 
    return past.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, ''); 
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const getBoardBadge = (code: string) => {
    const config = getBoardConfig(code);
    if (!config) return null;
    let bgColor = 'bg-slate-50 border-slate-100 text-slate-500';
    if (code === getBoardCode('G_BRD_NOTICE')) bgColor = 'bg-red-50 border-red-100 text-red-500';
    else if (code === getBoardCode('G_BRD_LICENSE')) bgColor = 'bg-blue-50 border-blue-100 text-blue-500';
    else if (code === getBoardCode('G_BRD_GREETING')) bgColor = 'bg-emerald-50 border-emerald-100 text-emerald-500';
    return <span className={`px-2 py-0.5 rounded ${bgColor} text-[10px] font-black border`}>{config.boardName}</span>;
  };

  const isMyMode = mode === 'my';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] transition-colors">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 ${isMyMode ? 'mb-12' : 'mb-8'}`}>
          <div>
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4 font-bold">
              <Link to="/" className="hover:text-primary transition-colors">{getText('common.home')}</Link>
              <ChevronRight size={14} />
              {isMyMode ? (
                <span className="text-slate-900 dark:text-white">내 활동 관리</span>
              ) : (
                <>
                  <Link to={`/practice-exams?boardCode=${encodeURIComponent(boardCode)}`} className={`${!categoryId ? 'text-slate-900 dark:text-white' : 'hover:text-primary transition-colors'}`}>{boardConfig?.boardName || '게시판'}</Link>
                  {categoryId && <><ChevronRight size={14} /><span className="text-slate-900 dark:text-white">{categories.find(c => c.categoryId === categoryId)?.categoryName || categoryId}</span></>}
                </>
              )}
            </nav>
            {isMyMode && (
              <>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-2xl text-primary"><User size={32} /></div>내 활동 관리</h1>
                <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium ml-1">내가 작성한 게시글을 한눈에 확인하고 관리하세요.</p>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9 space-y-6">
            {isMyMode ? (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => { const params = new URLSearchParams(searchParams); params.delete('boardCode'); params.set('page', '1'); setSearchParams(params); }} className={`flex-shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[15px] font-bold transition-all shadow-sm ${!boardCode ? 'bg-primary text-white' : 'bg-white dark:bg-[#1a222c] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}><Layers size={18} /> 전체 내역</button>
                {boardConfigs.filter(b => b.useYn === 'Y').map((config) => (
                  <button key={config.boardCode} onClick={() => { const params = new URLSearchParams(searchParams); params.set('boardCode', config.boardCode); params.set('page', '1'); setSearchParams(params); }} className={`flex-shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[15px] font-bold transition-all shadow-sm ${boardCode === config.boardCode ? 'bg-primary text-white' : 'bg-white dark:bg-[#1a222c] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}>{config.boardName}</button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                  {categories.length > 0 && ( 
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      <button onClick={() => { const params = new URLSearchParams(searchParams); params.delete('categoryId'); params.set('page', '1'); setSearchParams(params); }} className={`flex-shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[15px] font-bold transition-all shadow-sm ${!categoryId ? 'bg-[#3b82f6] text-white' : 'bg-white dark:bg-[#1a222c] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800'}`}><Layers size={18} /> 전체</button>
                      {categories.map((cat) => (
                        <button key={cat.categoryId} onClick={() => { const params = new URLSearchParams(searchParams); params.set('categoryId', cat.categoryId); params.set('page', '1'); setSearchParams(params); }} className={`flex-shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[15px] font-bold transition-all shadow-sm ${categoryId === cat.categoryId ? 'bg-[#3b82f6] text-white' : 'bg-white dark:bg-[#1a222c] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800'}`}><MessageCircle size={18} />{cat.categoryName}</button>
                      ))}
                    </div>
                  )}
                  {user && (boardCode !== 'N' || user.userRole == 'ADMIN') && (
                    <Link to={`/write-post?boardCode=${encodeURIComponent(boardCode)}${categoryId ? `&categoryId=${categoryId}` : ''}`} className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm flex-shrink-0"><PenSquare size={18} />새 글 작성</Link>
                  )}
                </div>
                <div className="bg-white dark:bg-[#1a222c] p-1.5 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none flex items-center group focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/40 transition-all duration-300">
                  <div className="relative flex items-center pl-4 pr-3 border-r border-slate-100 dark:border-slate-800 group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-colors">
                    <Filter className="text-slate-400 dark:text-slate-500 mr-2" size={16} />
                    <select value={size} onChange={handleSizeChange} className="appearance-none bg-transparent border-none text-[13px] font-black text-slate-600 dark:text-slate-300 outline-none cursor-pointer pr-5">
                      <option value="10">10</option><option value="30">30</option><option value="50">50</option><option value="100">100</option>
                    </select>
                    <ArrowUpDown className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none" size={10} />
                  </div>
                  <div className="flex-1 flex items-center pl-3">
                    <Search className={`mr-3 transition-all duration-300 ${isLoading && searchQuery ? 'text-primary animate-pulse' : 'text-slate-300 dark:text-slate-600 group-focus-within:text-primary'}`} size={20} />
                    <input type="text" placeholder="제목이나 내용에서 검색..." className="w-full bg-transparent border-none py-3.5 text-[15px] font-semibold outline-none focus:ring-0 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600" value={inputKeyword} onChange={handleSearchChange} onKeyDown={handleKeyDown} />
                  </div>
                  <button className="bg-primary text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-blue-600 transition-all shadow-md active:scale-90 shrink-0 ml-2" onClick={handleSearch} title="검색"><ChevronsRight size={18} /></button>
                </div>
              </div>
            )}
            
            {tagNameFilter && !isMyMode && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-top-2">
                <Tag size={18} className="text-primary" /><span className="text-sm font-black text-primary">#{tagNameFilter} 태그 검색 결과</span>
                <button onClick={clearTagFilter} className="ml-auto p-1.5 hover:bg-primary/10 rounded-full text-primary transition-colors"><X size={16} /></button>
              </div>
            )}

            <div className="bg-white dark:bg-[#1a222c] rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="hidden md:flex items-center bg-[#f6f7f8] dark:bg-slate-800/50 border-b border-[#e7edf3] dark:border-slate-800 px-8 py-4">
                <div className="w-20 text-[11px] font-bold text-[#4c739a] uppercase tracking-wider text-center">번호</div>
                <div className="flex-1 text-[11px] font-bold text-[#4c739a] uppercase tracking-wider px-4">제목</div>
                <div className="w-32 text-[11px] font-bold text-[#4c739a] uppercase tracking-wider text-center">작성자</div>
                <div className="w-32 text-[11px] font-bold text-[#4c739a] uppercase tracking-wider text-center">날짜</div>
                <div className="w-20 text-[11px] font-bold text-[#4c739a] uppercase tracking-wider text-center">조회</div>
                <div className="w-24 text-[11px] font-bold text-[#4c739a] uppercase tracking-wider text-center">좋아요</div>
              </div>
              <div className="min-h-[500px] divide-y divide-[#e7edf3] dark:divide-slate-800">
                {(!isLoading && !isDataStale) ? (
                  posts.length > 0 ? (
                    posts.map((post, idx) => {
                      const isRead = readPosts.includes(post.id);
                      const isNew = (new Date().getTime() - new Date(post.date).getTime()) < 24 * 60 * 60 * 1000;
                      const displayNo = post.seqNumber || (page - 1) * size + idx + 1;
                      return (
                        <div key={post.id} onClick={() => { handlePostClick(post.id); navigate(`/exam/${post.id}?boardCode=${encodeURIComponent(post.boardCode)}`); }} className="flex flex-col md:flex-row md:items-center px-8 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer h-auto md:h-[84px]">
                          <div className="hidden md:block w-20 text-sm text-[#4c739a] text-center font-bold flex-shrink-0">{String(displayNo).padStart(2, '0')}</div>
                          <div className="flex-1 px-4 min-w-0">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                {isMyMode && getBoardBadge(post.boardCode)}
                                <h3 className={`text-sm font-bold transition-colors truncate ${isRead ? 'text-slate-400' : 'text-[#0d141b] dark:text-white group-hover:text-primary'}`}>{post.title}</h3>
                                {(getBoardConfig(post.boardCode)?.replyYn === 'Y' && post.comments > 0) && <span className="text-primary font-black text-[11px] shrink-0">[{post.comments}]</span>}
                                {isNew && <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 text-[9px] font-black">NEW</span>}
                              </div>
                              {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {post.tags.map((t, i) => (
                                    <span key={i} onClick={(e) => { e.stopPropagation(); handleTagClick(t); }} className="px-1.5 py-0.5 bg-primary/5 text-primary text-[10px] font-medium rounded border border-primary/10 hover:bg-primary/10 transition-colors">#{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="w-full md:w-32 text-center text-[13px] font-medium text-slate-600 dark:text-slate-300 truncate mt-2 md:mt-0 flex-shrink-0">{post.author}</div>
                          <div className="w-full md:w-32 text-center text-[13px] text-[#4c739a] dark:text-slate-400 mt-1 md:mt-0 flex-shrink-0">{getCustomDateDisplay(post.date)}</div>
                          <div className="hidden md:block w-20 text-center text-[13px] text-[#4c739a] dark:text-slate-400 flex-shrink-0">{post.views}</div>
                          <div className="w-full md:w-24 flex items-center justify-center gap-1.5 mt-2 md:mt-0 flex-shrink-0">
                            <ThumbsUp size={14} className={post.likes > 0 ? 'fill-primary/10 text-primary' : 'text-slate-400'} />
                            <span className={`text-xs font-black ${post.likes > 0 ? 'text-primary' : 'text-slate-400'}`}>{post.likes}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-32 text-center text-[#4c739a]"><Search size={40} className="mx-auto mb-4 opacity-20" /><p className="font-bold">{isMyMode ? "아직 작성한 게시글이 없습니다. 첫 글을 남겨보세요! ✍️" : "게시글이 없습니다"}</p></div>
                  )
                ) : null}
              </div>
            </div>

            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 py-10">
                <button onClick={() => handlePageChange(1)} disabled={page === 1} className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#cfdbe7] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#4c739a] hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronsLeft size={18} /></button>
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#cfdbe7] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#4c739a] hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronLeft size={18} /></button>
                {getPageNumbers().map((p) => (
                  <button key={p} onClick={() => handlePageChange(p)} className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all ${p === page ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105' : 'border border-[#cfdbe7] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#4c739a] hover:bg-slate-50'}`}>{p}</button>
                ))}
                <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#cfdbe7] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#4c739a] hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronRight size={18} /></button>
                <button onClick={() => handlePageChange(totalPages)} disabled={page === totalPages} className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#cfdbe7] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#4c739a] hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronsRight size={18} /></button>
              </div>
            )}
          </div>

          <aside className="lg:col-span-3 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-6"><TrendingUp className="text-primary" size={18} /><h4 className="text-lg font-black dark:text-white tracking-tight">인기 게시글</h4></div>
                <div className="space-y-5">
                  {popularPosts.length > 0 ? popularPosts.map((post) => (
                    <Link key={post.id} to={`/exam/${post.id}?boardCode=S`} className="block group border-b border-slate-50 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-relaxed">{post.title}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold"><span>{formatRelativeTime(post.date)}</span><div className="flex items-center gap-2"><span className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20 text-rose-500 px-1.5 py-0.5 rounded-md"><Heart size={10} className="fill-rose-500" /> {post.likeCount}</span><span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md"><Eye size={10} /> {post.views}</span></div></div>
                    </Link>
                  )) : <div className="text-xs text-slate-400 text-center py-4">인기 게시글이 없습니다.</div>}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#cfdbe7] dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-[#0d141b] dark:text-white mb-4 flex items-center gap-2"><Hash className="text-primary" size={18} />실시간 급상승 태그</h3>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.length > 0 ? trendingTags.map((tag, i) => (
                    <button key={i} onClick={() => handleTagClick(tag)} className="px-3 py-1.5 rounded-lg bg-[#f6f7f8] dark:bg-slate-800 text-xs font-medium text-[#4c739a] dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-all">#{tag}</button>
                  )) : <p className="text-[11px] text-slate-400 py-4 text-center w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl font-bold ">현재 작성된 태그 데이터가 없습니다.</p>}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
