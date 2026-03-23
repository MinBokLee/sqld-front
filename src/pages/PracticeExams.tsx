import { useState, useEffect, useCallback, useContext } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MessageSquare, Eye, ThumbsUp, Clock, BookOpen,
  ArrowUpRight, PenSquare, Hash, Tag, X, TrendingUp, Heart,
  Layers, MessageCircle, Lightbulb, HelpCircle
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { useAlert } from '../contexts/AlertContext';
import { formatRelativeTime } from '../utils/dateUtils';
import api from '../utils/api';

/**
 * [PracticeExams.tsx]
 * @description 서비스의 메인 게시판 목록 페이지입니다. 
 * 공지사항, 학습 게시판, 가입인사 게시판을 하나의 컴포넌트에서 통합 관리하며,
 * URL 파라미터(type)에 따라 동적으로 게시판 성격을 전환합니다.
 */

/** [인터페이스 정의] 게시글의 기본 데이터 규격 */
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
}

/** [인터페이스 정의] 사이드바에 노출될 인기 게시글 규격 */
interface PopularPost {
  id: number;
  title: string;
  date: string;
  views: number;
  likeCount: number;
}

export default function PracticeExams() {
  /** [훅 초기화] 사용자 정보, 네비게이션, 언어 설정 등 공통 도구 준비 */
  const { user } = useUser();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  
  /** [URL 상태 제어] 
   * 게시판의 검색 상태(페이지, 카테고리, 검색어 등)를 URL 주소창에 동기화합니다.
   * 이를 통해 사용자가 '뒤로가기'를 눌러도 이전 검색 상태가 그대로 복구됩니다.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

  /** [파라미터 추출] URL에서 현재 필터링 및 페이징 정보 가져오기 */
  const type = searchParams.get('type') || 'S';           // 게시판 타입 (기본값: S - 학습게시판)
  const category = searchParams.get('category') || '';    // 서브 카테고리 (질문, 팁 등)
  const page = parseInt(searchParams.get('page') || '1'); // 현재 페이지 번호
  const searchQuery = searchParams.get('search') || '';   // 검색어 키워드
  const tagNameFilter = searchParams.get('tagName') || ''; // 특정 태그 검색 필터

  /** [내부 상태 관리] UI 렌더링에 필요한 로컬 데이터 저장소 */
  const [posts, setPosts] = useState<Post[]>([]);               // 현재 화면에 보여줄 게시글 배열
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]); // 우측 인기글 리스트
  const [totalPages, setTotalPages] = useState(1);              // 전체 페이지 개수 (페이징 버튼 생성용)
  const [isLoading, setIsLoading] = useState(true);             // 데이터 로딩 중 여부 (스켈레톤 노출용)
  const [readPosts, setReadPosts] = useState<number[]>([]);     // 로컬에 저장된 '내가 읽은 글' ID 목록
  const [trendingTags, setTrendingTags] = useState<string[]>([]); // 실시간 인기 태그 목록
  const [inputKeyword, setInputKeyword] = useState(searchQuery); // 로컬 검색어 상태

  // URL 파라미터가 변경되면 로컬 입력창 상태도 동기화
  useEffect(() => {
    setInputKeyword(searchQuery);
  }, [searchQuery]);

  const handleSearch = () => {
    if (!inputKeyword.trim()) {
      let message = "키워드를 입력해 주세요. ⚠️ 검색어 없이 조회를 진행할 수 없습니다.";
      if (type === 'N') message = "확인하실 공지사항 키워드를 입력해 주세요. 📢";
      else if (type === 'S') message = "키워드를 입력해 주세요. ⚠️ 학습 게시판 내에서 검색어를 통해 조회가 가능합니다.";
      else if (type === 'G') message = "찾으시는 회원님이나 인사말 키워드를 입력해 주세요. 😊";
      
      showAlert({ type: 'warning', message });
      return;
    }
    
    const params = new URLSearchParams(searchParams);
    params.set('search', inputKeyword.trim());
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  /** [API 연동 1] 실시간 인기 게시글 목록 조회 
   * 전체 게시판에서 조회수와 좋아요가 높은 상위 글들을 가져와 사이드바에 표시합니다.
   */
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

  /** [API 연동 2] 실시간 급상승 태그 데이터 추출
   * @description 모든 게시판에서 공통으로 'SQLD-학습(S)' 게시판의 최신 태그를 보여줍니다.
   * 사용자가 어떤 페이지에 있든 핵심 학습 키워드에 노출되도록 유도하는 정책입니다.
   */
  const fetchTrendingTags = useCallback(async () => {
    try {
      const response = await api.get(`/api/board/list/paging`, {
        params: { page: 1, size: 30, boardType: 'S' }
      });
      const data = response.data;
      if (data.success && data.result?.data?.list) {
        // 중첩된 데이터에서 태그 배열만 평탄화(flatten)하여 추출
        const allTags = data.result.data.list.flatMap((p: any) => 
          p.tags || (p.tagName ? p.tagName.split(',').map((t: string) => t.trim()) : [])
        );
        
        // 태그별 노출 횟수 집계 및 정렬
        const tagCounts: { [key: string]: number } = {};
        allTags.filter((t: string) => t).forEach((t: string) => { 
          tagCounts[t] = (tagCounts[t] || 0) + 1; 
        });
        
        const sortedTags = Object.keys(tagCounts)
          .sort((a, b) => tagCounts[b] - tagCounts[a])
          .slice(0, 12); // 상위 12개만 선정
          
        setTrendingTags(sortedTags);
      }
    } catch (error) {
      console.error("인기 태그 로드 실패:", error);
    }
  }, []);

  /** [API 연동 3] 메인 게시글 목록 조회 (페이징 및 필터 포함)
   * 사용자가 선택한 카테고리, 검색어, 태그 필터를 모두 조합하여 서버에 데이터를 요청합니다.
   */
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/board/list/paging`, {
        params: {
          page: page,
          size: 10,               // 한 페이지당 10개씩 표시
          boardType: type,        // N, S, G 중 하나
          category: category,     // 서브 카테고리
          title: searchQuery,     // 검색 키워드
          tagName: tagNameFilter  // 태그 필터
        }
      });

      const data = response.data;
      if (data.success && data.result && data.result.data) {
        const resultData = data.result.data;
        const postList = resultData.list || [];
        
        // 서버 응답 데이터를 프론트엔드 모델(Post)로 매핑
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
        }));
        
        setPosts(mappedPosts);
        setTotalPages(resultData.totalPages || 1);
      }
    } catch (error) {
      console.error("게시글 목록 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [type, category, page, searchQuery, tagNameFilter]);

  /** [이벤트 라이프사이클] 컴포넌트 등장 및 조건 변경 시 실행 로직 */
  useEffect(() => {
    fetchPosts();
    fetchPopularPosts();
    fetchTrendingTags();
  }, [fetchPosts, fetchPopularPosts, fetchTrendingTags]);

  /** [사용자 경험 최적화] 로컬 스토리지에서 읽은 글 기록 불러오기
   * 사용자가 이미 본 글의 제목을 회색으로 표시하여 편의성을 높입니다.
   */
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

  /** [UI 핸들러 1] 페이지 번호 클릭 시 이동 */
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 최상단으로 부드러운 스크롤
  };

  /** [UI 핸들러 2] 게시글 클릭 시 읽음 여부 기록 및 이동 */
  const handlePostClick = (postId: number) => {
    // 중복 제거 및 최신 글 위주로 500개까지만 기록
    const newReadPosts = Array.from(new Set([postId, ...readPosts])).slice(0, 500);
    setReadPosts(newReadPosts);
    localStorage.setItem('readPosts', JSON.stringify(newReadPosts));
  };

  /** [UI 핸들러 3] 태그 클릭 시 학습 게시판(S) 전용 검색 결과로 이동 
   * 정책: 모든 태그 클릭은 지식 전파를 위해 학습 게시판 검색으로 연결됩니다.
   */
  const handleTagClick = (tag: string) => {
    navigate(`/practice-exams?type=S&tagName=${encodeURIComponent(tag)}&page=1`);
  };

  /** [UI 핸들러 4] 현재 적용된 태그 필터 해제 */
  const clearTagFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('tagName');
    params.set('page', '1');
    setSearchParams(params);
  };

  /** [유틸리티] 하이브리드 날짜 표시 로직
   * - 24시간 이내: "N시간 전", "방금 전" (최신성 강조)
   * - 24시간 이후: "2024.03.16" (가독성 및 기록 명확성)
   */
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

  /** [페이징 도구] 표시할 페이지 번호 배열 생성 (최대 5개씩 노출) */
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] transition-colors">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* [1. 헤더 섹션] 타이틀 및 새 글 작성 버튼 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4">
              <Link to="/" className="hover:text-primary transition-colors font-medium">{getText('common.home')}</Link>
              <ChevronRight size={14} />
              <span className="text-slate-900 dark:text-white font-bold">
                {type === 'N' ? getText('board.notice') : type === 'G' ? getText('board.join_greetings') : getText('board.sqld_study')}
              </span>
            </nav>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              {type === 'N' ? '공지사항' : type === 'G' ? '가입 인사' : 'SQLD 학습 커뮤니티'}
            </h1>
          </div>
          
          {/*공지사항은 userRole값이 ADMIN인 사용자만 가능 */}
          {user && (type !== 'N' || user.userRole == 'ADMIN') &&(
          <Link 
            to={`/write-post?type=${type}${category ? `&category=${category}` : ''}`}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-primary/25 active:scale-95 text-sm"
          >
            <PenSquare size={18} />
            새 글 작성하기
          </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* [2. 게시판 콘텐츠 영역] 목록, 필터, 페이징 포함 */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* 2-1. 상단 컨트롤 바: 카테고리 필터 & 검색창 */}
            <div className="flex flex-col gap-6">
              {/* (start) SQLD-학습 게시판만 카테고리 필터를 보여준다. */}
              {type === 'S' && ( 
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
              )} {/* (end) SQLD-학습 게시판만 카테고리 필터를 보여준다. */}

              {/* 검색창 컨테이너 */}
              <div className="bg-white dark:bg-[#1a222c] p-2.5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center">
                <div className="flex-1 flex items-center pl-4">
                  <Search className="text-slate-400 mr-3" size={22} />
                  <input 
                    type="text" 
                    placeholder="제목이나 내용에서 검색..." 
                    className="w-full bg-transparent border-none py-3 text-[15px] font-medium outline-none focus:ring-0 dark:text-white placeholder:text-[#94a3b8]"
                    value={inputKeyword}
                    onChange={(e) => setInputKeyword(e.target.value)}
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
            
            
            {/* 2-2. 태그 필터 활성 안내 */}
            {tagNameFilter && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-top-2">
                <Tag size={18} className="text-primary" />
                <span className="text-sm font-black text-primary">#{tagNameFilter} 태그 검색 결과</span>
                <button onClick={clearTagFilter} className="ml-auto p-1.5 hover:bg-primary/10 rounded-full text-primary transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* 2-3. 전통적 리스트 게시판 (테이블 형식) */}
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
                      // 로딩 중 해골 스켈레톤 (10개 고정)
                      Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={6} className="px-8 py-10"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div></td>
                        </tr>
                      ))
                    ) : posts.length > 0 ? (
                      // 데이터 렌더링
                      posts.map((post, idx) => {
                        const isRead = readPosts.includes(post.id);
                        const isNew = (new Date().getTime() - new Date(post.date).getTime()) < 24 * 60 * 60 * 1000;
                        const displayNo = (page - 1) * 10 + idx + 1;

                        return (
                          <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => { handlePostClick(post.id); navigate(`/exam/${post.id}?type=${type}`); }}>
                            <td className="px-6 py-5 text-sm text-[#4c739a] text-center font-bold whitespace-nowrap">
                              {String(displayNo).padStart(2, '0')}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  <h3 className={`text-sm font-bold transition-colors truncate ${isRead ? 'text-slate-400' : 'text-[#0d141b] dark:text-white group-hover:text-primary'}`}>
                                    {post.title}
                                  </h3>
                                  {isNew && <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 text-[9px] font-black">NEW</span>}
                                  {post.comments > 0 && <span className="flex-shrink-0 text-primary font-black text-[11px]">[{post.comments}]</span>}
                                </div>
                                {/* 제목 하단 해시태그 칩 */}
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
                      // 결과 없음 안내
                      <tr>
                        <td colSpan={6} className="py-32 text-center text-[#4c739a]">
                          <Search size={40} className="mx-auto mb-4 opacity-20" />
                          <p className="font-bold">게시글이 없습니다</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2-4. 페이징 버튼 영역 */}
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

          {/* [3. 우측 사이드바] 인기글 및 급상승 태그 (Sticky 적용) */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              
              {/* 3-1. 인기 게시글 카드 */}
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

              {/* 3-2. 실시간 급상승 태그 (항상 학습 게시판 기준) */}
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
