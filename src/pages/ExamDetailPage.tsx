import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Eye, ThumbsUp, 
  Share2, Bookmark,
  X, Hash, 
  ChevronsRight,
  Download, Pencil, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useAlert } from '../contexts/AlertContext';
import { formatRelativeTime } from '../utils/dateUtils';
import api from '../utils/api';
import ConfirmModal from '../components/ConfirmModal';
import AttachmentSection from '../components/AttachmentSection';
import type { Attachment } from '../components/AttachmentSection';
import CommentSection from '../components/CommentSection';
import type { Comment } from '../components/CommentItem';
import PostSidebar from '../components/PostSidebar';
import type { PopularPost } from '../components/PostSidebar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface Exam {
  id: number;
  title: string;
  authorName: string;
  authorId: string;
  authorImage?: string;
  date: string;
  fullDate: string;
  views: number;
  commentsCount: number;
  likeCount: number;
  isLiked: boolean;
  isScrapped: boolean;
  scrapId?: number | null; // 스크랩 취소를 위한 ID
  content: string;
  boardType: string;
  files?: Attachment[];
  tagName?: string;
  tags?: string[];
}

const POST_CONTENT_STYLE = `
  .prose-container pre { background-color: #282c34 !important; color: #abb2bf !important; padding: 1.5rem !important; border-radius: 1rem !important; font-family: 'Fira Code', monospace !important; font-size: 0.875rem !important; margin: 2rem 0 !important; overflow-x: auto !important; border-left: 4px solid #61afef !important; }
  .prose-container :not(pre) > code { background-color: #e2e8f0 !important; color: #e11d48 !important; padding: 0.2rem 0.4rem !important; border-radius: 0.4rem !important; font-size: 0.9em !important; }
  .dark .prose-container :not(pre) > code { background-color: #1e293b !important; color: #fb7185 !important; }
  .prose-container .image { margin: 2rem 0; clear: both; display: table; }
  .prose-container .image img { display: block; max-width: 100%; border-radius: 1.5rem; box-shadow: 0 20px 50px -15px rgba(0,0,0,0.15); border: 4px solid white; transition: transform 0.3s ease; }
  .dark .prose-container .image img { border-color: #1e293b; }
  .prose-container .image-style-align-left { float: left; margin-right: 1.5rem; margin-left: 0; max-width: 50%; }
  .prose-container .image-style-align-right { float: right; margin-left: 1.5rem; margin-right: 0; max-width: 50%; }
  .prose-container .image-style-align-center { margin-left: auto !important; margin-right: auto !important; float: none !important; display: table !important; }
  .prose-container figure.table { margin: 2rem 0 !important; border-radius: 1rem !important; overflow: hidden !important; border: 1px solid #e2e8f0 !important; width: auto !important; max-width: 100% !important; display: block !important; }
  .prose-container figure.table table { border-collapse: collapse !important; margin: 0 !important; table-layout: fixed !important; width: 100% !important; min-width: 50px !important; }
  .prose-container figure.table th, .prose-container figure.table td { border: 1px solid #cbd5e1; padding: 0.75rem 1rem !important; word-break: break-all; }
  .prose-container figure.table th { background-color: #f1f5f9; font-weight: 900 !important; }
  .dark .prose-container figure.table th { background-color: #0f172a; color: #f1f5f9 !important; }
  @media (max-width: 640px) { .prose-container .image { max-width: 100% !important; float: none !important; } .prose-container figure.table table { min-width: 500px !important; } }
`;

const PostContent = React.memo(({ content, onImageClick }: { content: string, onImageClick: (url: string) => void }) => {
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') onImageClick((target as HTMLImageElement).src);
  };
  return (
    <div className="prose-container p-6 sm:p-10 prose dark:prose-invert max-w-none min-h-[300px]" onClick={handleClick}>
      <style dangerouslySetInnerHTML={{ __html: POST_CONTENT_STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
});

const ImageLightbox = ({ src, onClose }: { src: string | null, onClose: () => void }) => {
  return (
    <AnimatePresence>
      {src && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <img src={src} alt="Original" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border-4 border-white/10"/>
            <div className="absolute -top-12 right-0 flex items-center gap-3">
              <a href={src} download className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md border border-white/10"><Download size={20} /></a>
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md border border-white/10"><X size={20} /></button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Tooltip = ({ children, text }: { children: React.ReactNode, text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center justify-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && text && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-full mb-3 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded-lg whitespace-nowrap z-50">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ExamDetailPage() {
  const { id } = useParams();
  const { user } = useUser();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isSubmittingMainComment, setIsSubmittingMainComment] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void; type: 'danger' | 'warning' | 'info'; isLoading: boolean; }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'info', isLoading: false });

  const fixImagePath = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;

    let normalized = path;
    // 1. 서버의 물리적 절대 경로(/Users/...)인 경우 파일명만 추출
    if (path.includes('/Users/')) {
      normalized = path.split(/[\\/]/).pop() || '';
    }

    // 2. 'uploads'라는 단어가 포함된 경우 중복을 제거하고 /uploads/ 패턴으로 통일
    if (normalized.includes('uploads')) {
      return '/' + normalized.replace(/^[\/]*uploads\/*/, 'uploads/');
    }

    // 3. 그 외 파일명만 있는 경우 접두어 부착
    return `/uploads/${normalized}`;
  };

  const fixContentHtml = (html: string) => {
    if (!html) return '';
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    let correctedHtml = html;

    // 절대 경로 -> 상대 경로 변환
    correctedHtml = correctedHtml.replace(/src="https?:\/\/[^/]+\/uploads\//g, 'src="/uploads/');
    if (API_BASE_URL) {
      const escapedBaseUrl = API_BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      correctedHtml = correctedHtml.replace(new RegExp(`src="${escapedBaseUrl}/uploads/`, 'g'), 'src="/uploads/');
    }

    // [핵심] 중복된 /uploads/uploads 패턴 통합
    correctedHtml = correctedHtml.replace(/\/uploads\/+uploads\/*/g, '/uploads/');
    return correctedHtml;
  };

  const buildCommentTree = (flatComments: any[]): Comment[] => {
    const map: { [key: number]: any } = {};
    const roots: Comment[] = [];
    flatComments.forEach(comment => { map[comment.commentId] = { ...comment, replies: [] }; });
    flatComments.forEach(comment => {
      if (comment.parentCommentId && map[comment.parentCommentId]) {
        map[comment.parentCommentId].replies.push(map[comment.commentId]);
      } else { roots.push(map[comment.commentId]); }
    });
    return roots;
  };

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get(`/api/board/readComment`, { params: { boardId: id } });
      if (response.data.success) setComments(buildCommentTree(response.data.result.data || []));
    } catch (error) { console.error("Fetch comments error:", error); }
  }, [id]);

  const fetchPostDetail = useCallback(async (showLoading = false) => {
    if (showLoading) setInitialLoading(true);
    try {
      const response = await api.get(`/api/board/list/detail/${id}`);
      const rawData = response.data.result?.data || response.data.result;
      if (rawData) {
        setExam({
          id: rawData.boardId, title: rawData.title, authorName: rawData.userName, authorId: String(rawData.memberId || ''),
          authorImage: rawData.profileImage, date: rawData.createAt, fullDate: new Date(rawData.createAt).toLocaleString('ko-KR'),
          views: rawData.viewCount, commentsCount: rawData.commentCount || 0, likeCount: rawData.likeCount || 0, 
          isLiked: !!(rawData.isLiked || rawData.liked), 
          isScrapped: !!(rawData.isScrapped || rawData.scrapped), 
          scrapId: rawData.scrap_Id || null, // 서버에서 내려주는 scrap_Id 저장
          content: fixContentHtml(rawData.content), boardType: rawData.boardType,
          files: (rawData.fileList || rawData.files || []).map((f: any) => ({ fileId: f.fileId, originName: f.originName, filePath: fixImagePath(f.filePath || '') })),
          tags: rawData.tags || (rawData.tagName ? rawData.tagName.split(',').map((t: string) => t.trim()) : []),
        });
      }
    } catch (error) { console.error("Post detail error:", error); } finally { if (showLoading) setInitialLoading(false); }
  }, [id, user]);

  const fetchPopularPosts = useCallback(async () => {
    try {
      const response = await api.get(`/api/board/popularBoards`);
      if (response.data.success && response.data.result?.data) {
        setPopularPosts(response.data.result.data.map((item: any) => ({ id: item.boardId, title: item.title, date: item.createAt, views: item.viewCount || 0, likeCount: item.likeCount || 0 })));
      }
    } catch (error) { console.error("Popular posts error:", error); }
  }, []);

  const fetchTrendingTags = useCallback(async () => {
    try {
      const response = await api.get(`/api/board/list/paging`, { params: { page: 1, size: 30, boardType: 'S' } });
      if (response.data.success && response.data.result?.data?.list) {
        const allTags = response.data.result.data.list.flatMap((p: any) => p.tags || (p.tagName ? p.tagName.split(',').map((t: string) => t.trim()) : []));
        const tagCounts: { [key: string]: number } = {};
        allTags.filter((t: string) => t).forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
        setTrendingTags(Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]).slice(0, 12));
      }
    } catch (error) { console.error("Tags error:", error); }
  }, []);

  useEffect(() => {
    fetchPostDetail(true); fetchComments(); fetchPopularPosts(); fetchTrendingTags();
  }, [id, fetchPostDetail, fetchComments, fetchPopularPosts, fetchTrendingTags]);

  const handleCommentSubmit = useCallback(async (content: string, parentId: number | null = null): Promise<boolean> => {
    if (!user) { showAlert({ type: 'warning', message: "로그인이 필요한 서비스입니다. ✅" }); return false; }
    if (!content.trim()) return false;
    if (parentId === null) setIsSubmittingMainComment(true);
    try {
      const commentData = { boardId: Number(id), content: content, parentCommentId: parentId };
      const response = await api.post(`/api/board/writeComment`, commentData, { headers: { 'Authorization': `Bearer ${user.accessToken}` } });
      if (response.status === 200 || response.status === 201) {
        await fetchComments();
        setExam(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
        return true;
      }
      return false;
    } catch (error) { console.error("Comment error:", error); return false; } finally { if (parentId === null) setIsSubmittingMainComment(false); }
  }, [id, user, showAlert, fetchComments]);

  const handleDeleteComment = useCallback(async (commentId: number) => {
    if (!user) return;
    try {
      const response = await api.delete(`/api/board/deleteComment/${commentId}`, { headers: { 'Authorization': `Bearer ${user.accessToken}` } });
      if (response.status === 200) { await fetchComments(); setExam(prev => prev ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) } : null); showAlert({ type: 'success', message: "댓글 삭제 완료 ✅" }); }
    } catch (error) { console.error("Delete error:", error); }
  }, [user, fetchComments, showAlert]);

  const handleUpdateComment = useCallback(async (commentId: number, content: string) => {
    if (!user) return;
    try {
      const formData = new FormData(); formData.append('commentId', String(commentId)); formData.append('content', content);
      const response = await api.put(`/api/board/modifyComment`, formData, { headers: { 'Authorization': `Bearer ${user.accessToken}`, 'Content-Type': 'multipart/form-data' } });
      if (response.status === 200) { await fetchComments(); showAlert({ type: 'success', message: "댓글 수정 완료 ✨" }); }
    } catch (error) { console.error("Update error:", error); }
  }, [user, fetchComments, showAlert]);

  const handleLikeAction = useCallback(async () => {
    if (!user || !exam || isLiking) { if (!user) showAlert({ type: 'warning', message: "로그인이 필요합니다. ✅" }); return; }
    setIsLiking(true);
    try {
      const response = await api.post(`/api/board/like`, null, { params: { boardId: Number(id) }, headers: { 'Authorization': `Bearer ${user.accessToken}` } });
      if (response.status === 200) {
        const isNowLiked = !exam.isLiked;
        setExam(prev => prev ? { ...prev, isLiked: isNowLiked, likeCount: isNowLiked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1) } : null);
      }
    } catch (error) { console.error("Like error:", error); } finally { setIsLiking(false); }
  }, [id, user, exam, isLiking, showAlert]);

  const handleScrap = useCallback(async () => {
    if (!user || !exam) { 
      if (!user) showAlert({ type: 'warning', message: "로그인이 필요합니다. ✅" }); 
      return; 
    }

    if (exam.isScrapped && exam.scrapId) {
      // [취소] 백엔드 명세 준수: scrapIds 키로 감싼 배열 전달
      try {
        const response = await api.delete('/api/board/deleteMyScrapPage', {
          data: { 
            scrapIds: [Number(exam.scrapId)] 
          },
          headers: { 
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 200 || response.data.success) {
          setExam(prev => prev ? { ...prev, isScrapped: false, scrapId: null } : null);
          const successMsg = response.data.message || response.data.msg || "스크랩이 취소되었습니다. ✨";
          showAlert({ type: 'success', message: successMsg });
        }
      } catch (error) {
        console.error("Scrap cancel error:", error);
        showAlert({ type: 'error', message: "스크랩 취소 중 오류가 발생했습니다. ⏳" });
      }
    } else {
      // [등록] 기존 등록 로직 유지
      try {
        const response = await api.post(`/api/board/insertBoardScrap`, null, { 
          params: { boardId: id }, 
          headers: { 'Authorization': `Bearer ${user.accessToken}` } 
        });
        if (response.status === 200 || response.data.success) {
          const successMsg = response.data.message || response.data.msg || "스크랩 완료 ✨";
          showAlert({ type: 'success', message: successMsg });
          fetchPostDetail(); // 등록 성공 시 scrapId를 새로 받아오기 위해 갱신
        }
      } catch (error) {
        console.error("Scrap insert error:", error);
        showAlert({ type: 'error', message: "스크랩 처리 중 오류가 발생했습니다. ⏳" });
      }
    }
  }, [id, user, exam, showAlert, fetchPostDetail]);

  const handleDelete = useCallback(() => {
    setConfirmModal({ isOpen: true, title: '게시글 삭제', message: '정말로 이 게시글을 삭제하시겠습니까?', type: 'danger', isLoading: false, onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const response = await api.delete(`/api/board/list/${id}`, { headers: { 'Authorization': `Bearer ${user?.accessToken}` } });
          if (response.status === 200) { showAlert({ type: 'success', message: "삭제되었습니다. ✅" }); navigate(`/practice-exams?type=${exam?.boardType || 'S'}`); }
        } catch (error) { showAlert({ type: 'error', message: "삭제 오류 ⏳" }); } finally { setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false })); }
      }
    });
  }, [id, user, exam, navigate, showAlert]);

  const handleDownload = useCallback(async (fileId: number, fileName: string) => {
    if (!user) { showAlert({ type: 'warning', message: "로그인이 필요합니다. ✅" }); return; }
    try {
      const response = await api.get(`/api/board/download/${fileId}`, { responseType: 'blob', headers: { 'Authorization': `Bearer ${user.accessToken}` } });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', fileName);
      document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
    } catch (error) { showAlert({ type: 'error', message: "다운로드 오류 ⏳" }); }
  }, [user, showAlert]);

  if (initialLoading) return (<div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] text-slate-900 dark:text-white transition-colors relative z-10">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link to="/" className="hover:text-primary transition-colors font-medium">홈</Link>
          <ChevronsRight size={14} />
          <Link to={`/practice-exams?type=${exam?.boardType || 'S'}`} className="hover:text-primary transition-colors font-medium">{exam?.boardType === 'N' ? '공지사항' : 'SQLD 학습'}</Link>
          <ChevronsRight size={14} /><span className="font-bold truncate max-w-xs">{exam?.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9 space-y-8">
            <article className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {exam ? (
                <>
                  <div className="p-6 sm:p-10 border-b border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-6">
                      <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg uppercase">{exam.boardType === 'N' ? 'Announcement' : 'Community'}</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black leading-tight mb-8">{exam.title}</h1>
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-primary/5 flex items-center justify-center font-black text-xl text-primary border border-primary/10">
                          {exam.authorImage ? <img src={fixImagePath(exam.authorImage)!} alt="P" className="w-full h-full object-cover" /> : exam.authorName[0]}
                        </div>
                        <div>
                          <p className="text-base font-black">{exam.authorName}</p>
                          <p className="text-xs text-gray-500 font-medium">{formatRelativeTime(exam.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-slate-400 font-bold">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl"><Eye size={18} /> <span className="text-sm">{exam.views}</span></div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary rounded-xl"><ThumbsUp size={18} /> <span className="text-sm">{exam.likeCount}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 sm:px-10 py-4 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Tooltip text={exam.isLiked ? "추천 취소" : "이 글 추천"}>
                        <button onClick={handleLikeAction} className={`p-3 rounded-xl transition-all border ${exam.isLiked ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'}`}><ThumbsUp size={22} className={exam.isLiked ? 'fill-white' : ''} /></button>
                      </Tooltip>
                      <Tooltip text={exam.isScrapped ? "스크랩 취소" : "스크랩"}>
                        <button onClick={handleScrap} className={`p-3 rounded-xl transition-all border ${exam.isScrapped ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'}`}><Bookmark size={22} className={exam.isScrapped ? 'fill-orange-500' : ''} /></button>
                      </Tooltip>
                    </div>
                    {user && (String(user.memberId) === String(exam.authorId) || user.userRole === 'ADMIN') && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/write-post?boardId=${exam.id}&type=${exam.boardType}`)} className="p-3 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"><Pencil size={22} /></button>
                        <button onClick={handleDelete} className="p-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={22} /></button>
                      </div>
                    )}
                  </div>

                  <PostContent content={exam.content} onImageClick={(url) => setLightboxSrc(url)} />

                  <AttachmentSection files={exam.files || []} onImageClick={(url) => setLightboxSrc(url)} onDownload={handleDownload} />
                </>
              ) : null}
            </article>

            {exam && (
              <CommentSection 
                comments={comments} 
                user={user} 
                isSubmittingMain={isSubmittingMainComment} 
                onCommentSubmit={handleCommentSubmit} 
                onDeleteComment={handleDeleteComment} 
                onUpdateComment={handleUpdateComment} 
              />
            )}
          </div>

          <PostSidebar 
            popularPosts={popularPosts} 
            trendingTags={trendingTags} 
          />
        </div>
      </main>
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} isLoading={confirmModal.isLoading} />
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
