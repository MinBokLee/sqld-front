import React, { useState, useEffect, useCallback, useContext, memo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Eye, ThumbsUp, ThumbsDown, Clock, 
  Share2, Bookmark, ArrowLeft, Send, Trash2, Pencil,
  User, Check, X, MoreHorizontal, Reply, Hash, 
  TrendingUp, Heart, Tag, Search, ChevronsRight,
  FileText, Download, DownloadCloud, Paperclip, ZoomIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { useAlert } from '../contexts/AlertContext';
import { formatRelativeTime } from '../utils/dateUtils';
import api from '../utils/api';
import ConfirmModal from '../components/ConfirmModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface Attachment {
  fileId: number;
  originName: string;
  filePath: string;
}

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
  content: string;
  boardType: string;
  files?: Attachment[];
  tagName?: string;
  tags?: string[];
}

interface Comment {
  commentId: number;
  userName: string;
  userId: string;
  memberId: number;
  profileImage?: string;
  content: string;
  createAt: string;
  replies?: Comment[];
  parentCommentId?: number | null;
}

interface PopularPost {
  id: number;
  title: string;
  date: string;
  views: number;
  likeCount: number;
}

const CommentItem = memo(({ 
  comment, 
  isReply = false, 
  currentUser,
  onDelete,
  onUpdate,
  onSubmitReply,
  activeReplyId,
  setActiveReplyId
}: { 
  comment: Comment; 
  isReply?: boolean; 
  currentUser: any;
  onDelete: (id: number) => void;
  onUpdate: (id: number, content: string) => Promise<void>;
  onSubmitReply: (content: string, parentId: number) => void;
  activeReplyId: number | null;
  setActiveReplyId: (id: number | null) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [localReplyContent, setLocalReplyContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const canEdit = currentUser && String(currentUser.memberId) === String(comment.memberId);

  const handleUpdate = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }
    setIsProcessing(true);
    await onUpdate(comment.commentId, editContent);
    setIsProcessing(false);
    setIsEditing(false);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localReplyContent.trim()) return;
    onSubmitReply(localReplyContent, comment.commentId);
    setLocalReplyContent('');
    setActiveReplyId(null);
  };

  const fixProfileUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const fileName = path.split(/[\\/]/).pop();
    return `/uploads/${fileName}`;
  };

  const profileUrl = fixProfileUrl(comment.profileImage);

  return (
    <div className={`${isReply ? 'ml-6 sm:ml-12 mt-4 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border-l-4 border-primary/20' : 'mb-8'}`}>
      <div className="flex gap-4 group">
        <div className={`rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-700 ${isReply ? 'w-8 h-8' : 'w-10 h-10'}`}>
          {profileUrl ? (
            <img src={profileUrl} alt="P" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <User size={isReply ? 14 : 18} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              {isReply && <Reply size={12} className="text-primary rotate-180" />}
              <span className={`font-black text-slate-900 dark:text-white ${isReply ? 'text-xs' : 'text-sm'}`}>{comment.userName}</span>
              <span className="text-[10px] text-slate-400 font-bold">{formatRelativeTime(comment.createAt)}</span>
            </div>
            {canEdit && !isEditing && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"><Pencil size={14} /></button>
                <button onClick={() => onDelete(comment.commentId)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border-2 border-primary/20 rounded-xl p-3 text-sm focus:border-primary outline-none transition-all dark:text-white min-h-[80px] resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                <button onClick={handleUpdate} disabled={isProcessing} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"><Check size={16} /></button>
              </div>
            </div>
          ) : (
            <>
              <p className={`text-slate-700 dark:text-slate-300 leading-relaxed font-medium ${isReply ? 'text-xs' : 'text-sm'}`}>{comment.content}</p>
              {!isReply && (
                <button 
                  onClick={() => setActiveReplyId(activeReplyId === comment.commentId ? null : comment.commentId)}
                  className="text-[10px] font-black text-primary mt-2 flex items-center gap-1 hover:underline uppercase tracking-tighter"
                >
                  <MessageSquare size={10} /> Reply
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {activeReplyId === comment.commentId && !isReply && (
        <div className="ml-10 sm:ml-14 mt-4 animate-in fade-in slide-in-from-top-2">
          <form onSubmit={handleReplySubmit}>
            <textarea 
              value={localReplyContent}
              onChange={(e) => setLocalReplyContent(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 h-[100px] outline-none text-slate-900 dark:text-white shadow-sm resize-none"
              placeholder={`${comment.userName}님께 답글 남기기...`}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setActiveReplyId(null)} className="px-4 py-1.5 text-xs font-bold text-slate-400">Cancel</button>
              <button type="submit" disabled={isProcessing || !localReplyContent.trim()} className="px-6 py-1.5 bg-primary text-white text-xs font-black rounded-lg disabled:opacity-50 shadow-md shadow-primary/20">
                {isProcessing ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {comment.replies && comment.replies.map(reply => (
        <CommentItem 
          key={reply.commentId} 
          comment={reply} 
          isReply={true} 
          currentUser={currentUser}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onSubmitReply={onSubmitReply}
          activeReplyId={activeReplyId}
          setActiveReplyId={setActiveReplyId}
        />
      ))}
    </div>
  );
});

const POST_CONTENT_STYLE = `
  .prose-container pre { background-color: #282c34 !important; color: #abb2bf !important; padding: 1.5rem !important; border-radius: 1rem !important; font-family: 'Fira Code', monospace !important; font-size: 0.875rem !important; margin: 2rem 0 !important; overflow-x: auto !important; border-left: 4px solid #61afef !important; }
  .prose-container :not(pre) > code { background-color: #e2e8f0 !important; color: #e11d48 !important; padding: 0.2rem 0.4rem !important; border-radius: 0.4rem !important; font-size: 0.9em !important; }
  .dark .prose-container :not(pre) > code { background-color: #1e293b !important; color: #fb7185 !important; }
  .prose-container img { max-width: 60% !important; border-radius: 1.5rem !important; margin: 2.5rem auto !important; display: block !important; box-shadow: 0 20px 50px -15px rgba(0,0,0,0.15) !important; border: 4px solid white !important; }
  .dark .prose-container img { border-color: #1e293b !important; }
  .prose-container figure.table { margin: 2rem 0 !important; width: 100% !important; border-radius: 1rem !important; overflow: hidden !important; border: 1px solid #e2e8f0 !important; }
  .prose-container figure.table table { width: 100% !important; border-collapse: collapse !important; }
  .prose-container figure.table th, .prose-container figure.table td { border: 1px solid #cbd5e1; padding: 0.75rem 1rem !important; }
  .prose-container figure.table th { background-color: #f1f5f9; font-weight: 900 !important; }
  .dark .prose-container figure.table th { background-color: #0f172a; color: #f1f5f9 !important; }
  @media (max-width: 640px) { .prose-container img { max-width: 100% !important; } }
`;

const PostContent = memo(({ content, onImageClick }: { content: string, onImageClick: (url: string) => void }) => {
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
  const [mainCommentContent, setMainCommentContent] = useState('');
  const [isSubmittingMainComment, setIsSubmittingMainComment] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void; type: 'danger' | 'warning' | 'info'; isLoading: boolean; }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'info', isLoading: false });

  const fixImagePath = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `/uploads/${path.split(/[\\/]/).pop()}`;
  };

  const fixContentHtml = (html: string) => {
    if (!html) return '';
    let correctedHtml = html.replace(/src="http:\/\/localhost:8881\/uploads\//g, 'src="/uploads/');
    correctedHtml = correctedHtml.replace(new RegExp(`src="${API_BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/uploads/`, 'g'), 'src="/uploads/');
    correctedHtml = correctedHtml.replace(/src="[^"]*\/upload\/([^"]+)"/g, 'src="/uploads/$1');
    return correctedHtml;
  };

  /**
   * [중요] 평면 리스트 데이터를 계층형 트리 구조로 변환하는 함수
   */
  const buildCommentTree = (flatComments: any[]): Comment[] => {
    const map: { [key: number]: any } = {};
    const roots: Comment[] = [];

    flatComments.forEach(comment => {
      map[comment.commentId] = { ...comment, replies: [] };
    });

    flatComments.forEach(comment => {
      if (comment.parentCommentId && map[comment.parentCommentId]) {
        map[comment.parentCommentId].replies.push(map[comment.commentId]);
      } else {
        roots.push(map[comment.commentId]);
      }
    });

    return roots;
  };

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get(`/api/board/readComment`, { params: { boardId: id } });
      if (response.data.success) {
        const flatData = response.data.result.data || [];
        // 평면 리스트를 트리 구조로 변환하여 저장
        setComments(buildCommentTree(flatData));
      }
    } catch (error) { console.error("Fetch comments error:", error); }
  }, [id]);

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

  const fetchPostDetail = useCallback(async (showLoading = false) => {
    if (showLoading) setInitialLoading(true);
    try {
      const response = await api.get(`/api/board/list/${id}${user ? `?memberId=${user.memberId}` : ""}`);
      const examData = response.data.result?.data || response.data.result;
      if (examData) {
        setExam({
          id: examData.boardId, title: examData.title, authorName: examData.userName, authorId: String(examData.memberId || ''),
          authorImage: examData.profileImage, date: examData.createAt, fullDate: new Date(examData.createAt).toLocaleString('ko-KR'),
          views: examData.viewCount, commentsCount: examData.commentCount || 0, likeCount: examData.likeCount || 0, isLiked: !!examData.isLiked,
          content: fixContentHtml(examData.content), boardType: examData.boardType,
          files: (examData.fileList || examData.files || []).map((f: any) => ({ fileId: f.fileId, originName: f.originName, filePath: fixImagePath(f.filePath || '') })),
          tags: examData.tags || (examData.tagName ? examData.tagName.split(',').map((t: string) => t.trim()) : []),
        });
      }
    } catch (error) { console.error("Post detail error:", error); } finally { if (showLoading) setInitialLoading(false); }
  }, [id, user]);

  useEffect(() => {
    fetchPostDetail(true); fetchComments(); fetchPopularPosts(); fetchTrendingTags();
  }, [id, fetchPostDetail, fetchComments, fetchPopularPosts, fetchTrendingTags]);

  const handleCommentSubmit = async (content: string, parentId: number | null = null) => {
    if (!user) { showAlert({ type: 'warning', message: "로그인이 필요한 서비스입니다. ✅" }); return; }
    if (!content.trim()) return;
    if (parentId === null) setIsSubmittingMainComment(true);
    try {
      const commentData = { boardId: Number(id), content: content, parentCommentId: parentId };
      const response = await api.post(`/api/board/writeComment`, commentData, { headers: { 'Authorization': `Bearer ${user.accessToken}` } });
      if (response.status === 200 || response.status === 201) {
        if (parentId === null) setMainCommentContent(''); 
        await fetchComments();
        setExam(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
        showAlert({ type: 'success', message: "댓글이 등록되었습니다. ✨" });
      }
    } catch (error) { console.error("Comment submit error:", error); } finally { if (parentId === null) setIsSubmittingMainComment(false); }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;
    try {
      const response = await api.delete(`/api/board/deleteComment/${commentId}`, { headers: { 'Authorization': `Bearer ${user.accessToken}` } });
      if (response.status === 200) { await fetchComments(); setExam(prev => prev ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) } : null); showAlert({ type: 'success', message: "댓글이 삭제되었습니다. ✅" }); }
    } catch (error) { console.error("Delete comment error:", error); }
  };

  const handleUpdateComment = async (commentId: number, content: string) => {
    if (!user) return;
    try {
      const formData = new FormData(); formData.append('commentId', String(commentId)); formData.append('content', content);
      const response = await api.patch(`/api/board/modifyComment`, formData, { headers: { 'Authorization': `Bearer ${user.accessToken}`, 'Content-Type': 'multipart/form-data' } });
      if (response.status === 200) { await fetchComments(); showAlert({ type: 'success', message: "댓글이 수정되었습니다. ✨" }); }
    } catch (error) { console.error("Update comment error:", error); }
  };

  const handleLikeAction = async (action: 'like' | 'unlike') => {
    if (!user) { showAlert({ type: 'warning', message: "로그인이 필요한 서비스입니다. ✅" }); return; }
    if (isLiking || !exam) return;
    setIsLiking(true);
    try {
      const response = await api.post(`/api/board/${action}`, { boardId: Number(id), memberId: user.memberId }, { headers: { 'Authorization': `Bearer ${user.accessToken}` } });
      if (response.status === 200) { setExam(prev => prev ? { ...prev, isLiked: action === 'like', likeCount: action === 'like' ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1) } : null); }
    } catch (error) { console.error("Like error:", error); } finally { setIsLiking(false); }
  };

  const handleDelete = () => {
    setConfirmModal({ isOpen: true, title: '게시글 삭제', message: '정말로 이 게시글을 삭제하시겠습니까?', type: 'danger', isLoading: false, onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const response = await api.delete(`/api/board/list/${id}`, { headers: { 'Authorization': `Bearer ${user?.accessToken}` } });
          if (response.status === 200) { showAlert({ type: 'success', message: "게시글이 삭제되었습니다. ✅" }); navigate(`/practice-exams?type=${exam?.boardType || 'S'}`); }
        } catch (error) { showAlert({ type: 'error', message: "삭제 중 오류 발생 ⏳" }); } finally { setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false })); }
      }
    });
  };

  if (initialLoading) return (<div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div><p className="text-slate-400 font-black animate-pulse">L O A D I N G</p></div></div>);

  const authorProfileUrl = exam?.authorImage ? fixImagePath(exam.authorImage) : null;
  const myProfileUrl = user?.profileImage ? fixImagePath(user.profileImage) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] text-slate-900 dark:text-white transition-colors relative z-10">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link to="/" className="hover:text-primary transition-colors font-medium">홈</Link>
          <ChevronsRight size={14} />
          <Link to={`/practice-exams?type=${exam?.boardType || 'S'}`} className="hover:text-primary transition-colors font-medium">{exam?.boardType === 'N' ? '공지사항' : exam?.boardType === 'G' ? '가입 인사' : 'SQLD 학습'}</Link>
          <ChevronsRight size={14} />
          <span className="font-bold truncate max-w-xs">{exam?.title || '게시글'}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9 space-y-8">
            <article className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[400px]">
              {exam ? (
                <>
                  <div className="p-6 sm:p-10 border-b border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-6">
                      <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-tighter">{exam.boardType === 'N' ? 'Announcement' : 'Community'}</span>
                      {exam.tags && exam.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">{exam.tags.map((t, i) => (<Link key={i} to={`/practice-exams?type=${exam.boardType}&tagName=${encodeURIComponent(t)}`} className="text-[10px] text-primary font-black bg-primary/5 hover:bg-primary/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1"><Hash size={10} /> {t}</Link>))}</div>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black leading-tight mb-8">{exam.title}</h1>
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-primary/5 flex items-center justify-center font-black text-xl text-primary border border-primary/10 uppercase shadow-sm">
                          {authorProfileUrl ? <img src={authorProfileUrl} alt="P" className="w-full h-full object-cover" /> : (exam.authorName ? exam.authorName[0] : 'U')}
                        </div>
                        <div>
                          <p className="text-base font-black">{exam.authorName || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 font-medium cursor-help" title={exam.fullDate}>{formatRelativeTime(exam.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-slate-400 font-bold">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl"><Eye size={18} /> <span className="text-sm">{exam.views}</span></div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl"><MessageSquare size={18} /> <span className="text-sm">{exam.commentsCount}</span></div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary rounded-xl"><ThumbsUp size={18} /> <span className="text-sm">{exam.likeCount}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 sm:px-10 py-4 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleLikeAction('like')} disabled={isLiking || exam.isLiked} className={`p-3 rounded-xl transition-all shadow-sm active:scale-95 border ${exam.isLiked ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:text-primary hover:bg-primary/5'}`}><ThumbsUp size={22} /></button>
                      <button onClick={() => handleLikeAction('unlike')} disabled={isLiking || !exam.isLiked} className={`p-3 rounded-xl transition-all shadow-sm active:scale-95 border ${!exam.isLiked ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50' : 'bg-red-50 text-red-500 border border-red-100'}`}><ThumbsDown size={22} /></button>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                      <button title="스크랩" className="p-3 rounded-xl text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all"><Bookmark size={22} /></button>
                      <button title="공유하기" className="p-3 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"><Share2 size={22} /></button>
                    </div>
                    {user && exam && (String(user.memberId) === String(exam.authorId) || user.userRole === 'ADMIN') && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/write-post?boardId=${exam.id}&type=${exam.boardType}`, { replace: true })} title="글 수정" className="p-3 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"><Pencil size={22} /></button>
                        <button onClick={handleDelete} title="글 삭제" className="p-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><Trash2 size={22} /></button>
                      </div>
                    )}
                  </div>

                  <PostContent content={exam.content} onImageClick={(url) => setLightboxSrc(url)} />

                  {exam.files && exam.files.length > 0 && (
                    <div className="px-6 sm:px-10 py-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
                        <Paperclip size={18} className="text-primary" />
                        <h4 className="text-sm font-black uppercase tracking-widest">첨부파일 <span className="text-primary ml-1">{exam.files.length}</span></h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {exam.files.map((file, idx) => {
                          const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.originName);
                          return (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary/30 hover:shadow-md transition-all group cursor-default">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-600 transition-all ${isImage ? 'cursor-zoom-in hover:scale-105 hover:border-primary/50' : ''}`} onClick={() => isImage && setLightboxSrc(file.filePath)}>
                                  {isImage ? <img src={file.filePath} alt="preview" className="w-full h-full object-cover" /> : <FileText size={18} />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{file.originName}</span>
                                  {isImage && <span className="text-[10px] text-primary/60 font-medium">클릭하여 확대</span>}
                                </div>
                              </div>
                              <a href={`/api/board/download/${file.fileId}`} className="p-2 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all" title="다운로드"><Download size={16} /></a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full py-20 text-slate-400 font-bold">게시글을 불러오는 중입니다...</div>
              )}
            </article>

            {exam && (
              <section className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10">
                <div className="flex items-center gap-3 mb-10">
                  <MessageSquare className="text-primary" size={24} />
                  <h3 className="text-2xl font-black">댓글 <span className="text-primary">{comments.length}</span></h3>
                </div>
                
                <div className="space-y-4">
                  <form onSubmit={(e) => { e.preventDefault(); handleCommentSubmit(mainCommentContent); }} className="flex gap-5 mb-12">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/5 flex-shrink-0 flex items-center justify-center font-black text-primary border border-primary/10 uppercase">
                      {myProfileUrl ? <img src={myProfileUrl} alt="Me" className="w-full h-full object-cover" /> : (user?.userName ? user.userName[0] : 'U')}
                    </div>
                    <div className="flex-1 relative">
                      <textarea value={mainCommentContent} onChange={(e) => setMainCommentContent(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 min-h-[120px] outline-none text-slate-900 dark:text-white shadow-inner resize-none transition-all" placeholder="따뜻한 댓글로 지식을 나누어 보세요..."/>
                      <button type="submit" disabled={isSubmittingMainComment || !mainCommentContent.trim()} className="absolute bottom-4 right-4 p-3 bg-primary text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 active:scale-95">
                        {isSubmittingMainComment ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {comments.length > 0 ? (
                      comments.map(comment => (
                        <CommentItem key={comment.commentId} comment={comment} currentUser={user} onDelete={handleDeleteComment} onUpdate={handleUpdateComment} onSubmitReply={handleCommentSubmit} activeReplyId={activeReplyId} setActiveReplyId={setActiveReplyId} />
                      ))
                    ) : (
                      <div className="py-20 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700"><MessageSquare size={40} className="mx-auto mb-4 opacity-20" /><p className="font-bold">아직 작성된 댓글이 없습니다. ✨</p></div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="lg:col-span-3 space-y-8">
            <div className="lg:sticky lg:top-8 space-y-8">
              <div className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-8"><TrendingUp className="text-primary" size={20} /><h4 className="text-xl font-black dark:text-white tracking-tight">인기 게시글</h4></div>
                <div className="space-y-6">
                  {popularPosts.length > 0 ? popularPosts.map((post) => (
                    <Link key={post.id} to={`/exam/${post.id}?type=S`} className="block group border-b border-slate-50 dark:border-slate-800 pb-5 last:border-0 last:pb-0">
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors line-clamp-2 mb-3 leading-relaxed">{post.title}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold"><span>{formatRelativeTime(post.date)}</span><div className="flex items-center gap-3"><span className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20 text-rose-500 px-2 py-1 rounded-lg"><Heart size={10} className="fill-rose-500" /> {post.likeCount}</span><span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg"><Eye size={10} /> {post.views}</span></div></div>
                    </Link>
                  )) : ( <div className="text-xs text-slate-400 text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 font-bold">인기 게시글이 없습니다.</div> )}
                </div>
              </div>
              <div className="bg-[#0d141b] rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
                <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2 relative z-10"><Hash className="text-primary" size={18} /> 실시간 급상승 태그</h3>
                <div className="flex flex-wrap gap-2.5 relative z-10">
                  {trendingTags.length > 0 ? trendingTags.map((tag, i) => (<Link key={i} to={`/practice-exams?type=S&tagName=${encodeURIComponent(tag)}`} className="px-3.5 py-2 rounded-xl bg-white/5 text-[11px] font-black text-slate-400 hover:bg-primary hover:text-white transition-all border border-white/5 active:scale-95">#{tag}</Link>)) : ( <p className="text-[11px] text-slate-500 py-6 text-center w-full font-bold">작성된 태그가 없습니다.</p> )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} isLoading={confirmModal.isLoading} />
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
