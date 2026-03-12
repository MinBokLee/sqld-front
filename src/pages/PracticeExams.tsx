import { ChevronsRight, Home, Pencil, Search, Eye, MessageCircle, Lightbulb, HelpCircle, Layers, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight as ChevronsRightIcon, TrendingUp, ThumbsUp, Heart, Megaphone, BookOpen, Hand, Flame } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback, useContext } from "react";
import { useUser } from "../contexts/UserContext";
import { LanguageContext } from "../contexts/LanguageContext";
import { formatRelativeTime } from "../utils/dateUtils";
import Board, { type BoardItem } from "../components/Board";

const API_BASE_URL = "http://localhost:8881";

interface BoardFile {
  fileId: number;
  originName: string;
  filePath: string;
}

interface Post {
  seqNumber: number;
  id: number;
  title: string;
  userId: string;
  userName: string;
  date: string;
  views: number;
  commentsCount: number;
  likeCount: number;
  boardType: string;
  category?: string;
  files: BoardFile[];
  tagName?: string;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

  const typeCode = searchParams.get('type') || 'S';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentCategory = searchParams.get('category') || 'all';
  const searchKeyword = searchParams.get('keyword') || '';
  const filterUserId = searchParams.get('userId');
  const filterMemberId = searchParams.get('memberId');

  const [posts, setPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<BoardItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [inputKeyword, setInputKeyword] = useState(searchKeyword);
  const pageSize = 10;

  const fetchPopularPosts = async () => {
    try {
      const response = await fetch(`/api/board/popularBoards`);
      const data = await response.json();
      if (data.success && data.result && Array.isArray(data.result.data)) {
        setPopularPosts(data.result.data.map((item: any) => ({
          id: item.boardId,
          title: item.title,
          createAt: item.createAt,
          viewCount: item.viewCount || 0,
          likeCount: item.likeCount || 0,
          author: item.userName,
          boardType: item.boardType,
        })));
      }
    } catch (error) {
      console.error("Failed to fetch popular posts:", error);
    }
  };

  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        boardType: typeCode,
        page: currentPage.toString(),
        size: pageSize.toString(),
      });
      
      if (currentCategory !== 'all') query.set('category', currentCategory);
      if (searchKeyword) query.set('keyword', searchKeyword);
      
      // 내 활동 관리 필터링 지원: 파라미터 키를 memberId로 통일
      if (filterMemberId) query.set('memberId', filterMemberId);
      else if (filterUserId) query.set('memberId', filterUserId);

      const response = await fetch(`/api/board/list/paging?${query.toString()}`);
      const data = await response.json();
      
      if (data.success && data.result && data.result.data) {
        const resultData = data.result.data;
        const safeList = Array.isArray(resultData.list) ? resultData.list : [];
        
        setPosts(safeList.map((item: any) => ({
          seqNumber: item.seqNumber,
          id: item.boardId,
          title: item.title,
          userId: item.userId,
          userName: item.userName,
          date: item.createAt,
          views: item.viewCount,
          commentsCount: item.commentCount || 0,
          likeCount: item.likeCount || 0,
          boardType: item.boardType,
          category: item.category,
          files: item.files || [],
          tagName: item.tagName,
        })));
        setTotalCount(resultData.totalCount || 0);
        setTotalPages(resultData.totalPages || 1);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Fetch exams error:", error);
      alert("일시적인 오류로 정보를 가져올 수 없습니다.");
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, filterMemberId, filterUserId, typeCode, currentPage, currentCategory, searchKeyword]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    fetchPopularPosts();
  }, []);

  const handleSearch = () => {
    const newParams = new URLSearchParams();
    newParams.set('type', typeCode);
    newParams.set('page', '1');
    if (inputKeyword.trim()) {
      newParams.set('keyword', inputKeyword.trim());
    }
    navigate(`/practice-exams?${newParams.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', newPage.toString());
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleCategoryChange = (category: string) => {
    const nextParams = new URLSearchParams();
    nextParams.set('type', typeCode);
    nextParams.set('page', '1');
    if (category !== 'all') nextParams.set('category', category);
    setSearchParams(nextParams);
  };

  const getBoardTitle = () => {
    if (searchKeyword) return `"${searchKeyword}" 검색 결과`;
    if (filterMemberId || filterUserId) return "내가 작성한 글";
    switch (typeCode) {
      case 'N': return getText('board.notice');
      case 'G': return getText('board.join_greetings');
      default: return getText('board.sqld_study');
    }
  };

  const categories = [
    { id: 'all', label: getText('board.category.all'), icon: Layers, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    { id: 'question', label: getText('board.category.question'), icon: MessageCircle, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { id: 'tip', label: getText('board.category.tip'), icon: Lightbulb, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { id: 'faq', label: getText('board.category.faq'), icon: HelpCircle, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  ];

  const getEmptyStateContent = () => {
    if (searchKeyword) {
      return {
        icon: AlertCircle,
        title: "일치하는 검색 결과가 없습니다.",
        desc: "다른 키워드로 검색해 보세요.",
        showBtn: false
      };
    }

    switch (typeCode) {
      case 'N':
        return {
          icon: Megaphone,
          title: "등록된 공지사항이 없습니다.",
          desc: "새로운 업데이트를 기다려 주세요.",
          showBtn: false
        };
      case 'G':
        return {
          icon: Hand,
          title: "가입 인사가 없습니다.",
          desc: "첫인사를 남겨보시는 건 어떨까요?",
          showBtn: true,
          btnText: "가입인사 남기기"
        };
      default:
        return {
          icon: BookOpen,
          title: "등록된 게시글이 없습니다.",
          desc: "궁금한 질문이나 학습 팁을 공유해 주세요.",
          showBtn: true,
          btnText: "글 작성하기"
        };
    }
  };

  const emptyState = getEmptyStateContent();
  const EmptyIcon = emptyState.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] transition-colors duration-300">
      <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 font-sans">
        
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link className="hover:text-primary transition-colors flex items-center gap-1.5 font-bold" to="/">
            <Home size={16} /> {getText('common.home')}
          </Link>
          <ChevronsRight size={16} />
          <span className="font-black text-primary uppercase tracking-tighter">{getBoardTitle()}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9">
            <div className="mb-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                      {getBoardTitle()}
                    </h1>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
                    {searchKeyword ? `커뮤니티 내에서 "${searchKeyword}"와(과) 관련된 모든 글을 검색합니다.` : 
                    typeCode === 'N' ? 'SQLD 자격증 취득을 위한 공식 공지사항과 업데이트 소식을 확인하세요.' : 
                    typeCode === 'G' ? '새로 오신 회원님들을 환영합니다! 자유롭게 소통해 보세요.' : 
                    '함께 공부하면 합격이 더 쉬워집니다. 어려운 문제를 자유롭게 공유하는 공간입니다.'}
                  </p>
                </div>
                {user && (typeCode !== 'N' || user.userRole === 'ADMIN') && (
                  <Link to={`/write-post?type=${typeCode}${typeCode === 'S' ? `&category=${currentCategory === 'all' ? 'question' : currentCategory}` : ''}`}>
                    <button className="flex items-center justify-center gap-2.5 px-8 py-4.5 bg-primary text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-primary/25 hover:-translate-y-1 active:scale-95 group">
                      <Pencil size={20} className="group-hover:rotate-12 transition-transform" />
                      글쓰기
                    </button>
                  </Link>
                )}
              </div>

              {!searchKeyword && typeCode === 'S' && !filterMemberId && !filterUserId && (
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = currentCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                          isActive 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                          : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Icon size={18} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="bg-white dark:bg-[#1a222c] p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                    <Search size={22} />
                  </div>
                  <input 
                    className="w-full h-14 pl-16 pr-6 rounded-2xl border-none bg-slate-50 dark:bg-slate-800 text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400 dark:text-white" 
                    placeholder="제목이나 내용에서 검색..." 
                    type="text" 
                    value={inputKeyword}
                    onChange={(e) => setInputKeyword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  className="h-14 px-12 bg-slate-900 dark:bg-primary text-white text-base font-black rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                >
                  검색하기
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a222c] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all mb-10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest w-24">No.</th>
                      <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">게시글 제목</th>
                      <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest w-40 text-center">작성자</th>
                      <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest w-40 text-center">날짜</th>
                      <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">조회수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {isLoading ? (
                      [...Array(pageSize)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={5} className="px-8 py-6"><div className="h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl w-full" /></td>
                        </tr>
                      ))
                    ) : posts.length > 0 ? (
                      posts.map((post, index) => {
                        const displayNum = post.seqNumber ?? (totalCount - ((currentPage - 1) * pageSize) - index);
                        return (
                          <tr key={post.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                            <td className="px-8 py-6 text-sm font-bold text-slate-400 leading-none">
                              {displayNum}
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-2">
                                <Link className="text-base font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-snug" to={`/exam/${post.id}?type=${typeCode}`}>
                                  {post.title}
                                  {post.commentsCount > 0 && <span className="text-primary font-black text-xs ml-2 bg-primary/5 px-2 py-0.5 rounded-full">+{post.commentsCount}</span>}
                                </Link>
                                <div className="flex items-center gap-2">
                                  {post.tagName && <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase tracking-tighter">#{post.tagName}</span>}
                                  {post.category && <span className="text-[10px] font-black text-primary/60 bg-primary/5 px-2 py-0.5 rounded-md uppercase tracking-tighter">{post.category}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className={`text-sm font-black transition-colors ${post.userId === 'unknown' ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                {post.userName}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-center text-sm font-bold text-slate-400">{new Date(post.date).toLocaleDateString()}</td>
                            <td className="px-8 py-6 text-center">
                              <span className="inline-flex items-center gap-1 text-sm font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-xl">
                                <Eye size={14} strokeWidth={2.5} /> {post.views}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-32">
                          <div className="flex flex-col items-center justify-center gap-6 text-slate-300 dark:text-slate-700 animate-in fade-in zoom-in duration-500">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-full">
                              <EmptyIcon size={64} strokeWidth={1.5} className="text-primary opacity-50" />
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                                {emptyState.title}
                              </p>
                              <p className="text-base font-medium opacity-60 max-w-md mx-auto leading-relaxed">
                                {emptyState.desc}
                              </p>
                            </div>
                            {emptyState.showBtn && (
                              <Link to={`/write-post?type=${typeCode}`}>
                                <button className="px-8 py-4 bg-primary text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/25 flex items-center gap-2">
                                  <Pencil size={18} />
                                  {emptyState.btnText}
                                </button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!isLoading && totalPages > 1 && (
              <div className="flex flex-col items-center gap-8 mb-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="p-3 shadow-lg active:scale-90 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a222c] text-slate-400 hover:text-primary transition-all disabled:opacity-30"><ChevronsLeft size={18} /></button>
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-3 shadow-lg active:scale-90 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a222c] text-slate-400 hover:text-primary transition-all disabled:opacity-30"><ChevronLeft size={18} /></button>
                  <div className="flex items-center gap-2 mx-2 md:mx-4">
                    {getPageNumbers().map(num => (
                      <button key={num} onClick={() => handlePageChange(num)} className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl text-sm md:text-base font-black transition-all shadow-xl ${currentPage === num ? 'bg-primary text-white shadow-primary/40 scale-105 md:scale-110' : 'bg-white dark:bg-[#1a222c] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-primary'}`}>{num}</button>
                    ))}
                  </div>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-3 shadow-lg active:scale-90 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a222c] text-slate-400 hover:text-primary transition-all disabled:opacity-30"><ChevronRight size={18} /></button>
                  <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="p-3 shadow-lg active:scale-90 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a222c] text-slate-400 hover:text-primary transition-all disabled:opacity-30"><ChevronsRightIcon size={18} /></button>
                </div>
                <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-white dark:bg-[#1a222c] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span><p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{getText('board.total_start')} <span className="text-slate-900 dark:text-white">{totalCount.toLocaleString()}</span> {getText('board.total_end')}</p></div>
                  <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" /><p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{getText('board.page')} <span className="text-primary">{currentPage}</span> / {totalPages}</p>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-3 space-y-8">
            <div className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="text-primary" size={18} />
                <h4 className="text-lg font-black dark:text-white">인기 게시글</h4>
              </div>
              <div className="space-y-5">
                {popularPosts.length > 0 ? popularPosts.map((post) => (
                  <Link key={post.id} to={`/exam/${post.id}?type=S`} className="block group border-b border-slate-50 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-relaxed">
                      {post.title}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span>{formatRelativeTime(post.createAt)}</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20 text-rose-500 px-1.5 py-0.5 rounded-md">
                          <Heart size={10} className="fill-rose-500" /> {post.likeCount}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                          <Eye size={10} /> {post.viewCount}
                        </span>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="text-xs text-slate-400 text-center py-4">인기 게시글이 없습니다.</div>
                )}
              </div>
              
              <div className="mt-8 p-5 bg-gradient-to-br from-primary to-blue-600 rounded-2xl text-white shadow-lg overflow-hidden relative group">
                <div className="relative z-10">
                  <h5 className="font-black text-base mb-1">SQLD Pass Kit</h5>
                  <p className="text-[10px] opacity-90 leading-relaxed mb-4">완벽한 합격 전략을 <br/>확인해보세요.</p>
                  <button className="w-full py-2 bg-white text-primary rounded-2xl text-[10px] font-black hover:bg-blue-50 transition-colors">무료 혜택 받기</button>
                </div>
                <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <ThumbsUp size={80} />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
