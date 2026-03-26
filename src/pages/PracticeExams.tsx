import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MessageSquare, Eye, ThumbsUp, Clock, BookOpen,
  ArrowUpRight, PenSquare, Hash, Tag, X, TrendingUp, Heart,
  Layers, MessageCircle, Lightbulb, HelpCircle, User
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { useAlert } from '../contexts/AlertContext';
import { formatRelativeTime } from '../utils/dateUtils';
import api from '../utils/api';

/**
 * [PracticeExams.tsx]
 * @description 서비스의 메인 게시판 목록 페이지 및 내 활동 관리 페이지입니다. 
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
  boardType: string;
  category: string;
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
  const { showAlert } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();
  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

  const type = searchParams.get('type') || 'S';           
  const category = searchParams.get('category') || '';    
  const page = parseInt(searchParams.get('page') || '1'); 
  const searchQuery = searchParams.get('keyword') || ''; // 'search'에서 'keyword'로 통일
  const tagNameFilter = searchParams.get('tagName') || ''; 
  const mode = searchParams.get('mode') || ''; // 'my' 면 내 활동 관리 모드

  const [posts, setPosts] = useState<Post[]>([]);               
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]); 
  const [totalPages, setTotalPages] = useState(1);              
  const [isLoading, setIsLoading] = useState(true);             
  const [readPosts, setReadPosts] = useState<number[]>([]);     
  const [trendingTags, setTrendingTags] = useState<string[]>([]); 
  const [inputKeyword, setInputKeyword] = useState(searchQuery); 
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // URL 쿼리가 바뀌면 입력창도 동기화 (Header 검색 대응)
  useEffect(() => {
    setInputKeyword(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputKeyword(value);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value.trim()) {
        params.set('keyword', value.trim());
      } else {
        params.delete('keyword');
      }
      params.set('page', '1');
      setSearchParams(params);
    }, 500);
  };

  const handleSearch = useCallback(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    
    const trimmedKeyword = inputKeyword.trim();
    
    // 유효성 검사: 검색어가 없는 경우 알림창 출력 (Header와 일관성 유지)
    if (!trimmedKeyword) {
      let message = "키워드를 입력해 주세요. ⚠️ 검색어 없이 조회를 진행할 수 없습니다.";
      if (type === 'N') message = "확인하실 공지사항 키워드를 입력해 주세요. 📢";
      else if (type === 'S') message = "키워드를 입력해 주세요. ⚠️ 학습 게시판 내에서 검색어를 통해 조회가 가능합니다.";
      else if (type === 'G') message = "찾으시는 회원님이나 인사말 키워드를 입력해 주세요. 😊";
      
      showAlert({ type: 'warning', message });
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set('keyword', trimmedKeyword);
    params.set('page', '1');
    setSearchParams(params);
  }, [inputKeyword, type, searchParams, setSearchParams, showAlert]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      handleSearch();
    }
  };

  const fetchPopularPosts = useCallback(async () => {
    try {
      const response = await api.get(`/api/board/popularBoards`);
      const data = response.data;
      if (data.success && data.result && Array.isArray(data.result.data)) {
        setPopularPosts(data.result.data.map((item: any) => ({
          id: item.boardId,
          title: item.title,
          date: item.createAt,
          views: item.viewCount || 0,
          likeCount: item.likeCount || 0,
        })));
      }
    } catch (error) {
      console.error("인기 게시글 로드 실패:", error);
    }
  }, []);

  const fetchTrendingTags = useCallback(async () => {
    try {
      const response = await api.get(`/api/board/list/paging`, {
        params: { page: 1, size: 30, boardType: 'S' }
      });
      const data = response.data;
      if (data.success && data.result?.data) {
        const resultData = data.result.data;
        const postList = resultData.list || [];
        const allTags = postList.flatMap((p: any) => 
          p.tags || (p.tagName ? p.tagName.split(',').map((t: string) => t.trim()) : [])
        );
        const tagCounts: { [key: string]: number } = {};
        allTags.filter((t: string) => t).forEach((t: string) => { 
          tagCounts[t] = (tagCounts[t] || 0) + 1; 
        });
        const sortedTags = Object.keys(tagCounts)
          .sort((a, b) => tagCounts[b] - tagCounts[a])
          .slice(0, 12);
        setTrendingTags(sortedTags);
      }
    } catch (error) {
      console.error("인기 태그 로드 실패:", error);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const isMyMode = mode === 'my';
      let endpoint = '';
      let params: any = {
        page: page,
        size: 10,
      };

      // [핵심 분기 로직]
      if (searchQuery.trim() && !isMyMode) {
        // 1. 전문 검색(FTS) 모드: 검색어가 있는 경우
        endpoint = '/api/board/searchContent';
        params.keyword = searchQuery.trim();
        params.boardType = type;
      } else if (isMyMode) {
        // 2. 내 활동 관리 모드
        endpoint = '/api/board/my-list';
        params.keyword = searchQuery.trim(); // null 대신 빈 문자열 유도
      } else {
        // 3. 일반 목록 조회 모드: 검색어가 없는 경우
        endpoint = '/api/board/list/paging';
        params.boardType = type;
        params.category = type === 'S' ? category : '';
        params.tagName = tagNameFilter || undefined;
        params.keyword = ''; // null 대신 빈 문자열 명시
      }
      
      const response = await api.get(endpoint, { params });

      const data = response.data;
      if (data.success && data.result?.data) {
        const resultData = data.result.data;
        const postList = resultData.list || [];
        
        const mappedPosts = postList.map((item: any) => ({
          id: item.boardId,
          title: item.title,
          author: item.userName,
          authorImage: item.profileImage,
          date: item.createAt,
          views: item.viewCount,
          likes: item.likeCount,
          comments: item.commentCount,
          boardType: item.boardType,
          category: item.category,
          tags: item.tags || (item.tagName ? item.tagName.split(',').map((t: string) => t.trim()) : []),
          seqNumber: item.seqNumber
        }));
        
        setPosts(mappedPosts);
        setTotalPages(resultData.totalPage || 1);
      }
    } catch (error) {
      console.error("게시글 목록 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [type, category, page, searchQuery, tagNameFilter, mode]);

  useEffect(() => {
    fetchPosts();
    fetchPopularPosts();
    fetchTrendingTags();
  }, [fetchPosts, fetchPopularPosts, fetchTrendingTags]);

  useEffect(() => {
    const saved = localStorage.getItem('readPosts');
    if (saved) {
      try {
        setReadPosts(JSON.parse(saved));
      } catch (e) {
        console.error("읽은 글 기록 파싱 실패");
      }
    }
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
    navigate(`/practice-exams?type=S&tagName=${encodeURIComponent(tag)}&page=1`);
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

    if (diffInHours < 24) {
      return formatRelativeTime(dateString); 
    } else {
      return past.toLocaleDateString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).replace(/\. /g, '.').replace(/\.$/, ''); 
    }
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

  const getBoardBadge = (boardType: string) => {
    switch (boardType) {
      case 'N': return <span className="px-2 py-0.5 rounded bg-red-50 text-red-500 text-[10px] font-black border border-red-100">공지</span>;
      case 'S': return <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-500 text-[10px] font-black border border-blue-100">학습</span>;
      case 'G': return <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-500 text-[10px] font-black border border-emerald-100">자유</span>;
      default: return null;
    }
  };

  const isMyMode = mode === 'my';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] transition-colors">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4">
              <Link to="/" className="hover:text-primary transition-colors font-medium">{getText('common.home')}</Link>
              <ChevronRight size={14} />
              <span className="text-slate-900 dark:text-white font-bold">
                {isMyMode ? '내 활동 관리' : type === 'N' ? getText('board.notice') : type === 'G' ? getText('board.join_greetings') : getText('board.sqld_study')}
              </span>
            </nav>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              {isMyMode ? (
                <>
                  <div className="p-2 bg-primary/10 rounded-2xl text-primary"><User size={32} /></div>
                  내 활동 관리
                </>
              ) : (
                type === 'N' ? '공지사항' : type === 'G' ? '가입 인사' : 'SQLD 학습 커뮤니티'
              )}
            </h1>
            {isMyMode && <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium ml-1">내가 작성한 게시글을 한눈에 확인하고 관리하세요.</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-9 space-y-6">
            
            {!isMyMode && (
              <div className="flex flex-col gap-6">
                
                <div className="flex items-center justify-between gap-4">
                  {type === 'S' ? ( 
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {[
                        { id: '', label: '전체', icon: Layers },
                        { id: 'question', label: '질문', icon: MessageCircle },
                        { id: 'tip', label: '팁', icon: Lightbulb },
                        { id: 'faq', label: '자주 묻는 질문', icon: HelpCircle },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            const params = new URLSearchParams(searchParams);
                            params.set('category', cat.id);
                            params.set('page', '1');
                            setSearchParams(params);
                          }}
                          className={`flex-shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[15px] font-bold transition-all shadow-sm ${category === cat.id ? 'bg-[#3b82f6] text-white' : 'bg-white dark:bg-[#1a222c] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800'}`}
                        >
                          <cat.icon size={18} />
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div />
                  )}

                  {user && (type !== 'N' || user.userRole == 'ADMIN') && (
                    <Link 
                      to={`/write-post?type=${type}${category ? `&category=${category}` : ''}`}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm flex-shrink-0"
                    >
                      <PenSquare size={18} />
                      새 글 작성
                    </Link>
                  )}
                </div>

                <div className="bg-white dark:bg-[#1a222c] p-2.5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center">
                  <div className="flex-1 flex items-center pl-4">
                    <Search className={`mr-3 transition-colors ${isLoading && searchQuery ? 'text-primary animate-pulse' : 'text-slate-400'}`} size={22} />
                    <input 
                      type="text" 
                      placeholder="제목이나 내용에서 검색..." 
                      className="w-full bg-transparent border-none py-3 text-[15px] font-medium outline-none focus:ring-0 dark:text-white placeholder:text-[#94a3b8]"
                      value={inputKeyword}
                      onChange={handleSearchChange}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  <button 
                    className="bg-[#0d141b] dark:bg-slate-700 text-white px-8 py-3.5 rounded-[1.5rem] font-bold text-[15px] whitespace-nowrap hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                    onClick={handleSearch}
                  >
                    검색하기
                  </button>
                </div>
              </div>
            )}
            
            {tagNameFilter && !isMyMode && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-top-2">
                <Tag size={18} className="text-primary" />
                <span className="text-sm font-black text-primary">#{tagNameFilter} 태그 검색 결과</span>
                <button onClick={clearTagFilter} className="ml-auto p-1.5 hover:bg-primary/10 rounded-full text-primary transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-[#1a222c] rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-[#f6f7f8] dark:bg-slate-800/50 border-b border-[#e7edf3] dark:border-slate-800">
                      <th className="px-6 py-4 text-[11px] font-bold text-[#4c739a] uppercase tracking-wider w-[96px] text-center">번호</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#4c739a] uppercase tracking-wider">제목</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#4c739a] uppercase tracking-wider w-32 text-center">작성자</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#4c739a] uppercase tracking-wider w-32 text-center">날짜</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#4c739a] uppercase tracking-wider w-20 text-center">조회</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#4c739a] uppercase tracking-wider w-24 text-center">좋아요</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7edf3] dark:divide-slate-800">
                    {isLoading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={6} className="px-8 py-10"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div></td>
                        </tr>
                      ))
                    ) : posts.length > 0 ? (
                      posts.map((post, idx) => {
                        const isRead = readPosts.includes(post.id);
                        const isNew = (new Date().getTime() - new Date(post.date).getTime()) < 24 * 60 * 60 * 1000;
                        const displayNo = post.seqNumber || (page - 1) * 10 + idx + 1;

                        return (
                          <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => { handlePostClick(post.id); navigate(`/exam/${post.id}?type=${post.boardType}`); }}>
                            <td className="px-6 py-5 text-sm text-[#4c739a] text-center font-bold whitespace-nowrap">
                              {String(displayNo).padStart(2, '0')}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  {isMyMode && getBoardBadge(post.boardType)}
                                  <h3 className={`text-sm font-bold transition-colors truncate ${isRead ? 'text-slate-400' : 'text-[#0d141b] dark:text-white group-hover:text-primary'}`}>
                                    {post.title}
                                  </h3>
                                  {post.comments > 0 && (
                                    <span className="text-primary font-black text-[11px] shrink-0">
                                      [{post.comments}]
                                    </span>
                                  )}
                                  {isNew && <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 text-[9px] font-black">NEW</span>}
                                </div>
                                {post.tags && post.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {post.tags.map((t, i) => (
                                      <span 
                                        key={i} 
                                        onClick={(e) => { e.stopPropagation(); handleTagClick(t); }}
                                        className="px-1.5 py-0.5 bg-primary/5 text-primary text-[10px] font-medium rounded border border-primary/10 hover:bg-primary/10 transition-colors"
                                      >
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm text-center font-medium text-slate-600 dark:text-slate-300 truncate">{post.author}</td>
                            <td className="px-6 py-5 text-sm text-[#4c739a] dark:text-slate-400 text-center whitespace-nowrap">
                              {getCustomDateDisplay(post.date)}
                            </td>
                            <td className="px-6 py-5 text-sm text-[#4c739a] dark:text-slate-400 text-center font-medium">{post.views}</td>
                            <td className="px-6 py-5">
                              <div className={`flex items-center justify-center gap-1.5 ${post.likes > 0 ? 'text-primary' : 'text-slate-400'}`}>
                                <ThumbsUp size={14} className={post.likes > 0 ? 'fill-primary/10' : ''} />
                                <span className="text-xs font-black">{post.likes}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-32 text-center text-[#4c739a]">
                          <Search size={40} className="mx-auto mb-4 opacity-20" />
                          <p className="font-bold">{isMyMode ? "아직 작성한 게시글이 없습니다. 첫 글을 남겨보세요! ✍️" : "게시글이 없습니다"}</p>
                          {isMyMode && (
                            <Link to="/write-post?type=S" className="inline-block mt-6 px-6 py-2.5 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all text-sm">
                              첫 글 작성하기
                            </Link>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="text-primary" size={18} />
                  <h4 className="text-lg font-black dark:text-white tracking-tight">인기 게시글</h4>
                </div>
                <div className="space-y-5">
                  {popularPosts.length > 0 ? popularPosts.map((post) => (
                    <Link key={post.id} to={`/exam/${post.id}?type=S`} className="block group border-b border-slate-50 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-relaxed">
                        {post.title}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                        <span>{formatRelativeTime(post.date)}</span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20 text-rose-500 px-1.5 py-0.5 rounded-md"><Heart size={10} className="fill-rose-500" /> {post.likeCount}</span>
                          <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md"><Eye size={10} /> {post.views}</span>
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <div className="text-xs text-slate-400 text-center py-4">인기 게시글이 없습니다.</div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#cfdbe7] dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-[#0d141b] dark:text-white mb-4 flex items-center gap-2">
                  <Hash className="text-primary" size={18} />
                  실시간 급상승 태그
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.length > 0 ? trendingTags.map((tag, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleTagClick(tag)}
                      className="px-3 py-1.5 rounded-lg bg-[#f6f7f8] dark:bg-slate-800 text-xs font-medium text-[#4c739a] dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      #{tag}
                    </button>
                  )) : (
                    <p className="text-[11px] text-slate-400 py-4 text-center w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl font-bold "> 
                      현재 작성된 태그 데이터가 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
