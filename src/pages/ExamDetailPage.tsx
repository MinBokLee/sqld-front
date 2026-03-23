import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, memo } from "react";
import { 
  ChevronsRight, MessageSquare, Share2, Eye, Pencil, Trash2, 
  ThumbsUp, ThumbsDown, Bookmark, Heart, TrendingUp, Check, X, Hash
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useAlert } from "../contexts/AlertContext";
import { formatRelativeTime } from "../utils/dateUtils";
import api from "../utils/api";
import ConfirmModal from "../components/ConfirmModal";

interface BoardFile {
  fileId: number;
  originName: string;
  filePath: string; 
}

interface Comment {
  commentId: number;
  boardId: number;
  userId: string;
  userName: string;
  profileImage?: string; 
  content: string;
  createAt: string;
  parentCommentId: number | null;
  replies?: Comment[];
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
  files: BoardFile[];
  tagName?: string;
  tags?: string[];
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
  comment: Comment, 
  isReply?: boolean, 
  currentUser: any,
  onDelete: (id: number) => void,
  onUpdate: (id: number, content: string) => Promise<void>,
  onSubmitReply: (content: string, pid: number) => Promise<void>,
  activeReplyId: number | null,
  setActiveReplyId: (id: number | null) => void
}) => {
  const isCommentOwner = currentUser && String(currentUser.userId) === String(comment.userId);
  const isUnknown = comment.userId === 'unknown';
  
  const [isEditing, setIsEditing] = useState(false);
  const [localEditContent, setLocalEditContent] = useState(comment.content);
  const [localReplyContent, setLocalReplyContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpdate = async () => {
    if (!localEditContent.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      await onUpdate(comment.commentId, localEditContent);
      setIsEditing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localReplyContent.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      await onSubmitReply(localReplyContent, comment.commentId);
      setLocalReplyContent('');
      setActiveReplyId(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const getProfileImageUrl = (path?: string) => {
    if (!path || isUnknown) return null;
    if (path.startsWith('http')) return path;
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return formattedPath;
  };

  const profileUrl = getProfileImageUrl(comment.profileImage);

  return (
    <div className={`${isReply ? 'ml-12 mt-4' : 'mt-8'} group`}>
      <div className="flex gap-4">
        <div className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full overflow-hidden bg-primary/5 dark:bg-primary/10 flex-shrink-0 flex items-center justify-center text-xs font-black text-primary border border-primary/10 uppercase`}>
          {profileUrl ? (
            <img src={profileUrl} alt="P" className="w-full h-full object-cover" />
          ) : (
            comment.userName ? comment.userName[0].toUpperCase() : 'U'
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={`font-black text-sm ${isUnknown ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                {comment.userName}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">{formatRelativeTime(comment.createAt)}</span>
            </div>
            {isCommentOwner && !isEditing && (
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setIsEditing(true); setLocalEditContent(comment.content); }} className="text-slate-400 hover:text-primary p-1" title="수정"><Pencil size={14} /></button>
                <button onClick={() => onDelete(comment.commentId)} className="text-slate-400 hover:text-red-500 p-1" title="삭제"><Trash2 size={14} /></button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea 
                className="w-full bg-white dark:bg-slate-800 border border-primary/20 rounded-xl p-3 text-sm outline-none text-slate-900 dark:text-white resize-none h-[100px]"
                value={localEditContent}
                onChange={(e) => setLocalEditContent(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                <button onClick={handleUpdate} disabled={isProcessing} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"><Check size={16} /></button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{comment.content}</p>
              {!isReply && (
                <button 
                  onClick={() => setActiveReplyId(activeReplyId === comment.commentId ? null : comment.commentId)}
                  className="text-[11px] font-black text-primary mt-2 hover:underline uppercase tracking-tighter"
                >
                  Reply
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {activeReplyId === comment.commentId && !isReply && (
        <div className="ml-14 mt-4 animate-in fade-in slide-in-from-top-2">
          <form onSubmit={handleReplySubmit}>
            <textarea 
              value={localReplyContent}
              onChange={(e) => setLocalReplyContent(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 h-[120px] outline-none text-slate-900 dark:text-white shadow-sm resize-none"
              placeholder="답글을 입력하세요..."
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setActiveReplyId(null)} className="px-4 py-1.5 text-xs font-bold text-slate-400">Cancel</button>
              <button type="submit" disabled={isProcessing || !localReplyContent.trim()} className="px-4 py-1.5 bg-primary text-white text-xs font-black rounded-lg disabled:opacity-50">
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
  /* 고가독성 코드 블록 테마 (VS Code 스타일) */
  .prose-container pre { 
    background-color: #282c34 !important; 
    color: #abb2bf !important; 
    padding: 1.5rem !important; 
    border-radius: 1rem !important; 
    font-family: 'Fira Code', 'JetBrains Mono', monospace !important; 
    font-size: 0.875rem !important; 
    line-height: 1.7 !important; 
    margin: 2rem 0 !important; 
    overflow-x: auto !important; 
    border-left: 4px solid #61afef !important; 
    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5) !important; 
  }
  
  .prose-container pre code { 
    background: transparent !important; 
    color: inherit !important; 
    padding: 0 !important; 
    font-family: inherit !important;
  }

  /* 인라인 코드 강조 */
  .prose-container :not(pre) > code { 
    background-color: #e2e8f0 !important; 
    color: #e11d48 !important; 
    padding: 0.2rem 0.4rem !important; 
    border-radius: 0.4rem !important; 
    font-size: 0.9em !important; 
  }
  .dark .prose-container :not(pre) > code { 
    background-color: #1e293b !important; 
    color: #fb7185 !important; 
  }
  
  .prose-container blockquote {
    background: #1e293b !important;
    color: #38bdf8 !important;
    font-family: 'Fira Code', 'JetBrains Mono', monospace !important;
    padding: 1.5rem !important;
    border-radius: 1rem !important;
    border-left: 4px solid #3b82f6 !important;
    margin: 1.5rem 0 !important;
    font-style: normal !important;
    box-shadow: inset 0 2px 10px rgba(0,0,0,0.2) !important;
    position: relative !important;
    overflow-x: auto !important;
    display: block !important;
    height: auto !important;
  }
  .prose-container blockquote p { margin: 0 !important; line-height: 1.7 !important; }
  .prose-container blockquote::before {
    content: 'SQL CODE' !important;
    display: block !important;
    font-size: 10px !important;
    font-weight: 900 !important;
    color: #64748b !important;
    margin-bottom: 0.8rem !important;
    letter-spacing: 0.1em !important;
  }

  .prose-container img { 
    max-width: 100% !important; 
    max-height: 800px !important; 
    height: auto !important; 
    object-fit: contain !important; 
    margin: 2rem 0 !important; 
    border-radius: 1rem !important; 
    box-shadow: 0 20px 50px -20px rgba(0,0,0,0.2) !important; 
    display: block;
    content-visibility: auto;
  }

  /* CKEditor 이미지 정렬 클래스 지원 */
  .prose-container .image-style-align-left {
    float: left;
    margin-right: 2rem !important;
    margin-bottom: 1rem !important;
    max-width: 50% !important;
  }
  .prose-container .image-style-align-right {
    float: right;
    margin-left: 2rem !important;
    margin-bottom: 1rem !important;
    max-width: 50% !important;
  }
  .prose-container .image-style-side {
    float: right;
    margin-left: 2rem !important;
    margin-bottom: 1rem !important;
    max-width: 30% !important;
  }
  .prose-container .image-style-block-align-left {
    margin-left: 0 !important;
    margin-right: auto !important;
  }
  .prose-container .image-style-block-align-right {
    margin-left: auto !important;
    margin-right: 0 !important;
  }
  .prose-container .image-style-align-center,
  .prose-container figure.image {
    margin-left: auto !important;
    margin-right: auto !important;
    display: table;
  }
  
  .prose-container .image-style-align-center img,
  .prose-container figure.image img {
    margin-left: auto !important;
    margin-right: auto !important;
  }

  .prose-container .image::after {
    content: "";
    display: table;
    clear: both;
  }

  /* 테이블(표) 스타일 최적화 (사용자 지정 색상 반영) */
  .prose-container figure.table {
    margin: 1.5rem 0 !important;
    width: auto !important;
    max-width: 100% !important;
    display: block !important;
  }
  
  .prose-container figure.table table {
    border-collapse: collapse !important;
    width: 100% !important;
    border-width: 1px !important;
    border-style: solid !important;
    background-color: white; 
  }
  .dark .prose-container figure.table table {
    background-color: #1e293b;
  }
  
  .prose-container figure.table th,
  .prose-container figure.table td {
    border-width: 1px !important;
    border-style: solid !important;
    border-color: #cbd5e1; 
    padding: 0.75rem 1rem !important;
    min-width: 60px;
    background-color: inherit; 
  }
  .dark .prose-container figure.table th,
  .dark .prose-container figure.table td {
    border-color: #475569;
  }
  
  .prose-container figure.table th {
    background-color: #f1f5f9;
    font-weight: 900 !important;
    color: #0f172a !important;
  }
  .dark .prose-container figure.table th {
    background-color: #0f172a;
    color: #f1f5f9 !important;
  }

  /* 표 정렬 지원 */
  .prose-container figure.table.table-align-left { margin-left: 0 !important; margin-right: auto !important; }
  .prose-container figure.table.table-align-center { margin-left: auto !important; margin-right: auto !important; }
  .prose-container figure.table.table-align-right { margin-left: auto !important; margin-right: 0 !important; }

  /* 폰트 사이즈 연동 */
  .prose-container .text-tiny { font-size: 0.7em; }
  .prose-container .text-small { font-size: 0.85em; }
  .prose-container .text-big { font-size: 1.4em; }
  .prose-container .text-huge { font-size: 1.8em; font-weight: 900; }

  /* 하이라이트(형광펜) 색상 정의 */
  .prose-container .marker-yellow { background-color: #fef08a !important; color: #854d0e !important; padding: 0 4px; border-radius: 4px; }
  .prose-container .marker-green { background-color: #bbf7d0 !important; color: #166534 !important; padding: 0 4px; border-radius: 4px; }
  .prose-container .marker-pink { background-color: #fbcfe8 !important; color: #9d174d !important; padding: 0 4px; border-radius: 4px; }
  .prose-container .marker-blue { background-color: #bfdbfe !important; color: #1e40af !important; padding: 0 4px; border-radius: 4px; }

  /* 미디어 임베드(Media) 스타일 */
  .prose-container .media {
    margin: 2rem 0;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 20px 50px -20px rgba(0,0,0,0.2);
  }
  .prose-container .media iframe {
    width: 100% !important;
    aspect-ratio: 16 / 9;
    border: none;
  }

  @media (max-width: 640px) {
    .prose-container img { max-width: 100% !important; }
    .prose-container figure.table { width: 100% !important; overflow-x: auto !important; display: block !important; }
    .prose-container figure.table table { min-width: 500px !important; }
  }
`;

const PostContent = memo(({ content }: { content: string }) => {
  return (
    <div className="prose-container p-6 sm:p-10 prose dark:prose-invert max-w-none min-h-[300px]">
      <style dangerouslySetInnerHTML={{ __html: POST_CONTENT_STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
});

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

  // 모달 상태 관리
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info',
    isLoading: false
  });

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  const fixImagePath = (path: string) => {
    if (!path) return '';
    const fileName = path.split(/[\\/]/).pop();
    return `/uploads/${fileName}`;
  };

  const getProfileImageUrl = (path?: string, isUnknown?: boolean) => {
    if (!path || isUnknown) return null;
    if (path.startsWith('http')) return path;
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return formattedPath;
  };

  const fixContentHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/src="([^"]+)"/g, (match, src) => {
      if (src.startsWith('http')) return match;
      return `src="${fixImagePath(src)}"`;
    });
  };

  const structureComments = (flatComments: Comment[]) => {
    const map: { [key: number]: Comment } = {};
    const roots: Comment[] = [];
    flatComments.forEach(comment => { map[comment.commentId] = { ...comment, replies: [] }; });
    flatComments.forEach(comment => {
      if (comment.parentCommentId && map[comment.parentCommentId]) {
        map[comment.parentCommentId].replies?.push(map[comment.commentId]);
      } else { roots.push(map[comment.commentId]); }
    });
    return roots;
  };

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get(`/api/board/readComment?boardId=${id}`);
      const data = response.data;
      const rawComments = data.result?.data || data.data || data.result || [];
      setComments(structureComments(rawComments));
    } catch (error) { console.error(error); }
  }, [id]);

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
      console.error("Failed to fetch popular posts:", error);
    }
  }, []);

  const fetchTrendingTags = useCallback(async () => {
    try {
      const response = await api.get(`/api/board/list/paging`, {
        params: { page: 1, size: 30, boardType: 'S' }
      });
      const data = response.data;
      if (data.success && data.result?.data?.list) {
        const allTags = data.result.data.list.flatMap((p: any) => 
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

  const fetchPostDetail = useCallback(async (showLoading = false) => {
    if (showLoading) setInitialLoading(true);
    try {
      const loginId = user ? user.memberId : "";
      const queryParam = loginId ? `?memberId=${loginId}` : "";
      const response = await api.get(`/api/board/list/${id}${queryParam}`);
      const data = response.data;
      const examData = data.result?.data || data.data || data.result;
      if (examData) {
        const isLikedFromServer = examData.isLiked === true || examData.isLiked === "true" || examData.isLiked === 1 || examData.is_liked === true;
        setExam({
          id: examData.boardId, 
          title: examData.title, 
          authorName: examData.userName,
          authorId: String(examData.memberId || examData.userId || ''),
          authorImage: examData.profileImage || examData.userProfileImage || examData.authorImage,
          date: examData.createAt, fullDate: new Date(examData.createAt).toLocaleString('ko-KR'),
          views: examData.viewCount, commentsCount: examData.commentCount || 0,
          likeCount: examData.likeCount || 0, isLiked: isLikedFromServer,
          content: fixContentHtml(examData.content), boardType: examData.boardType,
          files: (examData.files || []).map((f: any) => ({ fileId: f.fileId, originName: f.originName, filePath: fixImagePath(f.filePath || f.saveName) })),
          tagName: examData.tagName,
          tags: examData.tags || (examData.tagName ? examData.tagName.split(',').map((t: string) => t.trim()) : []),
        });
      }
    } catch (error) { 
      console.error("Fetch detail error:", error); 
    } finally { 
      if (showLoading) setInitialLoading(false); 
    }
  }, [id, user]);

  useEffect(() => {
    fetchPostDetail(true);
    fetchComments();
    fetchPopularPosts();
    fetchTrendingTags();
  }, [id, fetchPostDetail, fetchComments, fetchPopularPosts, fetchTrendingTags]);

  const handleCommentSubmit = async (content: string, parentId: number | null = null) => {
    if (!user) { 
      showAlert({ type: 'warning', message: "로그인이 필요한 서비스입니다. ✅ 로그인 후 다시 시도해 주세요." });
      return; 
    }
    if (!content.trim()) return;
    if (parentId === null) setIsSubmittingMainComment(true);
    try {
      const response = await api.post(`/api/board/writeComment`, {
        boardId: Number(id),
        content,
        parentCommentId: parentId
      }, {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      });
      if (response.status === 200 || response.status === 201) {
        if (parentId === null) setMainCommentContent(''); 
        await fetchComments();
        setExam(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
      }
    } catch (error) { 
      console.error("Comment submit error:", error); 
    } finally { 
      if (parentId === null) setIsSubmittingMainComment(false); 
    }
  };

  const handleCommentUpdate = async (commentId: number, content: string) => {
    try {
      await api.put(`/api/board/modifyComment`, null, {
        params: { commentId, content },
        headers: { 'Authorization': `Bearer ${user?.accessToken}` }
      });
      await fetchComments();
    } catch (error) { console.error(error); }
  };

  const handleCommentDelete = (commentId: number) => {
    setConfirmModal({
      isOpen: true,
      title: '댓글 삭제',
      message: '작성하신 댓글을 정말 삭제하시겠습니까?\n삭제된 댓글은 복구할 수 없습니다.',
      type: 'danger',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          await api.delete(`/api/board/deleteComment`, {
            params: { commentId },
            headers: { 'Authorization': `Bearer ${user?.accessToken}` }
          });
          await fetchComments(); 
          setExam(prev => prev ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) } : null);
          showAlert({ type: 'success', message: "댓글이 삭제되었습니다. ✅" });
          closeConfirmModal();
        } catch (error) { 
          console.error(error);
          showAlert({ type: 'error', message: "댓글 삭제 중에 문제가 생겼어요. ⏳" });
        } finally {
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handleLikeAction = async (actionType: 'like' | 'unlike') => {
    if (!user) { 
      showAlert({ type: 'warning', message: "로그인이 필요한 서비스입니다. ✅ 로그인 후 다시 시도해 주세요." });
      return; 
    }
    if (isLiking || !exam) return;
    setIsLiking(true);
    try {
      const response = await api.post(`/api/board/like`, null, {
        params: { boardId: id, memberId: user.memberId },
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      });
      const result = response.data;
      const isNowLiked = result.result?.data !== undefined ? result.result.data : result.data;
      if (result.success || result.code === 200) { setExam(prev => prev ? { ...prev, isLiked: !!isNowLiked, likeCount: isNowLiked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1) } : null); }
    } catch (error) { console.error(error); } finally { setIsLiking(false); }
  };

  const handleDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: '게시글 삭제',
      message: '정말 이 게시글을 삭제하시겠습니까?\n함께 나눈 소중한 지식과 댓글이 모두 사라지게 됩니다.',
      type: 'danger',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const response = await api.delete(`/api/board/list/${id}`, {
            headers: { 'Authorization': `Bearer ${user?.accessToken}` }
          });
          if (response.status === 200) {
            showAlert({ type: 'success', message: "게시글이 성공적으로 삭제되었습니다. ✅" });
            closeConfirmModal();
            navigate(`/practice-exams?type=${exam?.boardType || 'S'}`);
          }
        } catch (error) { 
          console.error("Delete error:", error); 
          showAlert({ type: 'error', message: "게시글 삭제 중에 문제가 생겼어요. ⏳" });
        } finally {
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  if (initialLoading) return <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0d141b]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;

  const isAuthorUnknown = exam?.authorId === 'unknown' || !exam?.authorId;
  const authorProfileUrl = exam ? getProfileImageUrl(exam.authorImage, isAuthorUnknown) : null;
  const myProfileUrl = getProfileImageUrl(user?.profileImage);

  // 권한 체크 로직 강화: memberId와 userId 모두 대응
  const canEdit = user && (
    user.userRole === 'ADMIN' || 
    (exam?.authorId && (
      String(user.memberId) === String(exam.authorId) || 
      String(user.userId) === String(exam.authorId)
    ))
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] text-slate-900 dark:text-white transition-colors relative z-10">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link to="/" className="hover:text-primary transition-colors font-medium">홈</Link>
          <ChevronsRight size={14} />
          <Link to={`/practice-exams?type=${exam?.boardType || 'S'}`} className="hover:text-primary transition-colors font-medium">
            {exam?.boardType === 'N' ? '공지사항' : exam?.boardType === 'G' ? '가입 인사' : 'SQLD 학습'}
          </Link>
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
                        <div className="flex flex-wrap gap-2">
                          {exam.tags.map((t, i) => (
                            <Link 
                              key={i} 
                              to={`/practice-exams?type=${exam.boardType}&tagName=${encodeURIComponent(t)}`}
                              className="text-[10px] text-primary font-black bg-primary/5 hover:bg-primary/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                            >
                              <Hash size={10} /> {t}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black leading-tight mb-8">{exam.title}</h1>
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-primary/5 flex items-center justify-center font-black text-xl text-primary border border-primary/10 uppercase shadow-sm">
                          {authorProfileUrl ? (
                            <img src={authorProfileUrl} alt="P" className="w-full h-full object-cover" />
                          ) : (
                            exam.authorName ? exam.authorName[0] : 'U'
                          )}
                        </div>
                        <div>
                          <p className={`text-base font-black ${isAuthorUnknown ? 'text-slate-400' : ''}`}>{exam.authorName || 'Unknown'}</p>
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
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => navigate(`/write-post?boardId=${exam.id}&type=${exam.boardType}`, { replace: true })}
                          title="글 수정" 
                          className="p-3 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                        >
                          <Pencil size={22} />
                        </button>
                        <button onClick={handleDelete} title="글 삭제" className="p-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><Trash2 size={22} /></button>
                      </div>
                    )}
                  </div>

                  <PostContent content={exam.content} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full py-20 text-slate-400 font-bold">게시글을 불러오는 중입니다...</div>
              )}
            </article>

            {exam && (
              <section className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10" style={{ contain: 'layout' }}>
                <div className="flex items-center gap-3 mb-10">
                  <MessageSquare className="text-primary" size={24} />
                  <h3 className="text-2xl font-black">댓글 <span className="text-primary">{exam.commentsCount}</span></h3>
                </div>
                
                <div className="space-y-4">
                  <form onSubmit={(e) => { e.preventDefault(); handleCommentSubmit(mainCommentContent); }} className="flex gap-5 mb-12">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/5 flex-shrink-0 flex items-center justify-center font-black text-primary border border-primary/10 uppercase">
                      {myProfileUrl ? (
                        <img src={myProfileUrl} alt="P" className="w-full h-full object-cover" />
                      ) : (
                        user ? user.userName[0] : 'U'
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <textarea 
                        value={mainCommentContent} 
                        onChange={(e) => setMainCommentContent(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 h-[120px] outline-none transition-all dark:text-white resize-none" 
                        placeholder={user ? "댓글을 남겨보세요..." : "로그인이 필요합니다."} 
                        disabled={!user || isSubmittingMainComment} 
                      />
                      <div className="flex justify-end"><button type="submit" disabled={isSubmittingMainComment || !mainCommentContent.trim()} className="px-8 py-3 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/25 disabled:opacity-50">{isSubmittingMainComment ? '등록 중...' : '등록'}</button></div>
                    </div>
                  </form>

                  <div className="divide-y divide-slate-50 dark:divide-slate-800 min-h-[200px]">
                    {comments.map(comment => (
                      <CommentItem key={comment.commentId} comment={comment} currentUser={user} onDelete={handleCommentDelete} onUpdate={handleCommentUpdate} onSubmitReply={handleCommentSubmit} activeReplyId={activeReplyId} setActiveReplyId={setActiveReplyId} />
                    ))}
                    {comments.length === 0 && !initialLoading && <div className="text-center py-20 text-slate-400 font-bold">첫 댓글의 주인공이 되어 보세요!</div>}
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="lg:col-span-3 lg:sticky lg:top-28 lg:self-start space-y-8">
            <div className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
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

            <div className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-sm font-bold text-[#0d141b] dark:text-white mb-4 flex items-center gap-2">
                <Hash className="text-primary" size={18} />
                실시간 급상승 태그
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingTags.length > 0 ? trendingTags.map((tag, i) => (
                  <Link 
                    key={i} 
                    to={`/practice-exams?type=S&tagName=${encodeURIComponent(tag)}`}
                    className="px-3 py-1.5 rounded-lg bg-[#f6f7f8] dark:bg-slate-800 text-xs font-medium text-[#4c739a] dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    #{tag}
                  </Link>
                )) : (
                  <p className="text-[11px] text-slate-400 py-4 text-center w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl font-bold "> 
                    현재 작성된 태그 데이터가 없습니다.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
}
