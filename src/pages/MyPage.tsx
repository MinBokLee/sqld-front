import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  User, Mail, Calendar, Settings, 
  ChevronRight, Bookmark, FileText, 
  Trash2, MessageSquare, Clock, Shield,
  ArrowUpRight, ExternalLink, Inbox, CheckCircle2,
  AlertCircle, LayoutGrid, List as ListIcon,
  ChevronsLeft as ChevronsLeftIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronsRight as ChevronsRightIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useAlert } from '../contexts/AlertContext';
import { useBoard } from '../contexts/BoardContext';
import api from '../utils/api';
import ConfirmModal from '../components/ConfirmModal';

/**
 * [MyPage.tsx]
 * @description 사용자 활동 관리 페이지 - 500 에러 방지를 위한 호출 로직 보정
 */

interface MyPost {
  boardId: number;
  title: string;
  createAt: string;
  viewCount: number;
  commentCount: number;
  boardCode: string;
}

interface Scrap {
  scrapId: number;
  boardId: number;
  title: string;
  createAt: string;
  userName: string;
  boardCode: string;
}

export default function MyPage() {
  const { user } = useUser();
  const { showToast } = useAlert();
  const { getBoardConfig } = useBoard();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTab = searchParams.get('tab') || 'profile';
  const page = parseInt(searchParams.get('page') || '1');
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const fetchScraps = useCallback(async (pageNum: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const res: any = await api.get('/api/board/searchScrapMyPage', { params: { page: pageNum, size: 10 } });
      
      let actualData = res;
      if (res && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
         actualData = res.data;
         if (actualData.data && typeof actualData.data === 'object' && !Array.isArray(actualData.data)) {
            actualData = actualData.data;
         }
      }

      const list = actualData?.list || (Array.isArray(actualData) ? actualData : []) || [];
      setScraps(list);
      setTotalCount(actualData?.totalCount || actualData?.totalElements || list.length);
      
      const serverTotalPage = actualData?.totalPages || actualData?.totalPage || actualData?.total_pages || 0;
      if (serverTotalPage > 0) {
        setTotalPages(serverTotalPage);
      } else {
        setTotalPages(list.length === 10 ? pageNum + 1 : pageNum);
      }
    } catch (error) { 
      console.error("Scrap load error:", error); 
      setScraps([]);
    } finally { setLoading(false); }
  }, [user]);

  const fetchMyPosts = useCallback(async (pageNum: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const res: any = await api.get('/api/board/my-list', { params: { page: pageNum, size: 10 } });
      
      let actualData = res;
      if (res && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
         actualData = res.data;
         if (actualData.data && typeof actualData.data === 'object' && !Array.isArray(actualData.data)) {
            actualData = actualData.data;
         }
      }

      const list = actualData?.list || (Array.isArray(actualData) ? actualData : []) || [];
      setMyPosts(list);
      setTotalCount(actualData?.totalCount || actualData?.totalElements || list.length);
      
      const serverTotalPage = actualData?.totalPages || actualData?.totalPage || actualData?.total_pages || 0;
      if (serverTotalPage > 0) {
        setTotalPages(serverTotalPage);
      } else {
        setTotalPages(list.length === 10 ? pageNum + 1 : pageNum);
      }
    } catch (error) { 
      console.error("Posts load error:", error); 
      setMyPosts([]);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (activeTab === 'scraps') fetchScraps(page);
    else if (activeTab === 'posts') fetchMyPosts(page);
  }, [activeTab, page, fetchScraps, fetchMyPosts, user, navigate]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    const isScrap = activeTab === 'scraps';
    setConfirmModal({
      isOpen: true,
      title: isScrap ? '스크랩 삭제' : '게시글 삭제',
      message: `선택한 ${selectedItems.length}개의 항목을 삭제하시겠습니까?`,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          const endpoint = isScrap ? '/api/board/deleteMyScrapPage' : '/api/board/list/deleteBoardContent';
          const payload = isScrap ? { scrapIds: selectedItems } : { boardIds: selectedItems };
          await api.delete(endpoint, { data: payload });
          if (isScrap) fetchScraps(); else fetchMyPosts();
          setSelectedItems([]);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error(error);
        } finally { setIsDeleting(false); }
      }
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getBoardName = (code: string) => getBoardConfig(code)?.boardName || '게시판';

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] transition-colors duration-300 font-sans">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <User className="text-primary" size={36} /> 마이페이지
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium ml-1">나의 활동과 계정 설정을 관리하세요.</p>
        </header>

        <div className="flex bg-white dark:bg-[#1a222c] p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 w-fit mb-10">
          <button onClick={() => setSearchParams({ tab: 'profile' })} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'profile' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>프로필</button>
          <button onClick={() => setSearchParams({ tab: 'scraps' })} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'scraps' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>스크랩</button>
          <button onClick={() => setSearchParams({ tab: 'posts' })} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'posts' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>내 글</button>
        </div>

        {activeTab === 'profile' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 bg-white dark:bg-[#1a222c] rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                <div className="size-32 rounded-[2.5rem] overflow-hidden bg-primary/10 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl mb-6">
                  {user.profileImage ? <img src={user.profileImage} alt="P" className="w-full h-full object-cover" /> : <User className="text-primary" size={48} />}
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{user.userName}</h2>
                <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs">{user.userRole}</p>
                <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-8" />
                <div className="space-y-4 w-full text-left">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold"><Mail size={16} /><span className="text-sm truncate">{user.userEmail || user.userId}</span></div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold"><Shield size={16} /><span className="text-sm">계정 상태: {user.userStatus === 'Y' ? '활성' : '미승인'}</span></div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#1a222c] p-8 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 group hover:border-primary/30 transition-all">
                    <FileText className="text-emerald-500 mb-4" size={24} />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-tighter">작성한 게시글</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{user.postCount || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-[#1a222c] p-8 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 group hover:border-primary/30 transition-all">
                    <MessageSquare className="text-blue-500 mb-4" size={24} />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-tighter">작성한 댓글</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{user.commentCount || 0}</p>
                  </div>
                </div>
                <div className="bg-slate-900 dark:bg-primary rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 size-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-2">프리미엄 학습 경험 🚀</h3>
                    <p className="text-white/70 font-bold text-sm mb-8 leading-relaxed">SQLD 자격증 취득을 위한 최적의 커뮤니티에서<br />다양한 학습 자료와 실시간 정보를 공유받으세요.</p>
                    <button className="px-8 py-3.5 bg-white text-slate-900 rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all">혜택 더보기</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {(activeTab === 'scraps' || activeTab === 'posts') && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-[#1a222c] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {activeTab === 'scraps' ? <Bookmark className="text-primary" /> : <FileText className="text-primary" />}
                  {activeTab === 'scraps' ? '나의 스크랩 내역' : '내가 쓴 게시글'}
                  <span className="text-xs font-bold text-slate-400 ml-2">Total {totalCount}</span>
                </h3>
                {selectedItems.length > 0 && (
                  <button onClick={handleDeleteSelected} className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white text-sm font-black rounded-2xl hover:bg-red-600 transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"><Trash2 size={16} /> 선택 삭제 ({selectedItems.length})</button>
                )}
              </div>

              <div className="hidden md:flex items-center bg-slate-50/30 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-16 text-center">선택</div>
                <div className="flex-1 px-4">제목 및 게시판 정보</div>
                <div className="w-32 text-center">작성일</div>
                <div className="w-20 text-center">보기</div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 min-h-[400px]">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="px-8 py-10 animate-pulse"><div className="h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl w-full" /></div>
                  ))
                ) : (activeTab === 'scraps' ? scraps : myPosts).length > 0 ? (activeTab === 'scraps' ? scraps : myPosts).map((item) => {
                  const itemId = activeTab === 'scraps' ? (item as Scrap).scrapId : (item as MyPost).boardId;
                  return (
                    <div key={itemId} className={`flex flex-col md:flex-row md:items-center px-8 py-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group ${selectedItems.includes(itemId) ? 'bg-primary/5' : ''}`}>
                      <div className="w-16 flex justify-center mb-4 md:mb-0">
                        <input type="checkbox" className="size-5 rounded-md border-2 border-slate-200 text-primary focus:ring-primary/20 cursor-pointer" checked={selectedItems.includes(itemId)} onChange={() => toggleSelect(itemId)} />
                      </div>
                      <div className="flex-1 px-0 md:px-4 min-w-0">
                        <Link to={`/exam/${item.boardId}?boardCode=${encodeURIComponent(item.boardCode)}`} className="group/link block">
                          <p className="text-base font-black text-slate-900 dark:text-white group-hover/link:text-primary transition-colors line-clamp-1">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-black text-slate-500 uppercase tracking-tighter border border-slate-200/50">{getBoardName(item.boardCode)}</span>
                            {activeTab === 'scraps' && <span className="text-[10px] text-slate-400 font-bold tracking-tight">By {(item as Scrap).userName}</span>}
                          </div>
                        </Link>
                      </div>
                      <div className="w-full md:w-32 text-center text-xs font-bold text-slate-400 mt-4 md:mt-0">{new Date(item.createAt).toLocaleDateString()}</div>
                      <div className="w-full md:w-20 flex justify-center mt-4 md:md:mt-0">
                        <Link to={`/exam/${item.boardId}?boardCode=${encodeURIComponent(item.boardCode)}`} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary/30 rounded-xl transition-all shadow-sm active:scale-90"><ArrowUpRight size={18} /></Link>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-32 text-center text-slate-300 dark:text-slate-700"><Inbox size={64} strokeWidth={1} className="mx-auto mb-4" /><p className="text-xl font-black">내역이 없습니다.</p></div>
                )}
              </div>
            </div>

            {/* Pagination UI 추가 */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 py-10">
                <button onClick={() => handlePageChange(1)} disabled={page === 1} className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronsLeftIcon size={18} /></button>
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronLeftIcon size={18} /></button>
                {getPageNumbers().map((p) => (
                  <button key={p} onClick={() => handlePageChange(p)} className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all ${p === page ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105' : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50'}`}>{p}</button>
                ))}
                <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronRightIcon size={18} /></button>
                <button onClick={() => handlePageChange(totalPages)} disabled={page === totalPages} className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronsRightIcon size={18} /></button>
              </div>
            )}
          </section>
        )}

        <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type="danger" isLoading={isDeleting} />
      </main>
    </div>
  );
}
