import React, { useState, memo } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import CommentItem from './CommentItem';
import type { Comment } from './CommentItem';

/**
 * [인터페이스] 메인 댓글 입력 폼 Props
 */
interface MainCommentFormProps {
  user: any; 
  onSubmit: (content: string) => Promise<boolean>;
  isSubmitting: boolean;
}

/**
 * [내부 컴포넌트] 게시글 하단에 고정된 메인 댓글 작성창
 */
const MainCommentForm = memo(({ user, onSubmit, isSubmitting }: MainCommentFormProps) => {
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    
    const success = await onSubmit(content);
    if (success) setContent(''); // 작성 성공 시 입력창 초기화
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-5 mb-12">
      {/* 사용자 프로필 아바타 */}
      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/5 flex-shrink-0 flex items-center justify-center font-black text-primary border border-primary/10 uppercase">
        {user?.profileImage ? (
          <img src={user.profileImage} alt="Me" className="w-full h-full object-cover" />
        ) : (
          user?.userName ? user.userName[0] : 'U'
        )}
      </div>
      {/* 입력 영역 및 전송 버튼 */}
      <div className="flex-1 relative">
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 min-h-[120px] outline-none text-slate-900 dark:text-white shadow-inner resize-none transition-all" 
          placeholder="따뜻한 댓글로 지식을 나누어 보세요..."
        />
        <button 
          type="submit" 
          disabled={isSubmitting || !content.trim()} 
          className="absolute bottom-4 right-4 p-3 bg-primary text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
    </form>
  );
});

/**
 * [인터페이스] CommentSection 전체 컴포넌트 Props
 */
interface CommentSectionProps {
  comments: Comment[];            // 전체 댓글 트리 데이터
  user: any;                      // 현재 로그인 사용자
  isSubmittingMain: boolean;      // 메인 댓글 등록 중 상태
  onCommentSubmit: (content: string, parentId?: number | null) => Promise<boolean>; // 댓글 등록 핸들러
  onDeleteComment: (id: number) => void; // 댓글 삭제 핸들러
  onUpdateComment: (id: number, content: string) => Promise<void>; // 댓글 수정 핸들러
}

/**
 * [컴포넌트] 댓글 섹션 통합 컴포넌트
 * 댓글 헤더, 입력 폼, 목록 렌더링을 모두 포함합니다.
 */
const CommentSection = memo(({ 
  comments, 
  user, 
  isSubmittingMain, 
  onCommentSubmit,
  onDeleteComment,
  onUpdateComment
}: CommentSectionProps) => {
  // 답글 입력창 활성화 상태 관리 (하위 CommentItem들과 공유)
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);

  return (
    <section className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10">
      {/* 댓글 헤더: 총 개수 표시 */}
      <div className="flex items-center gap-3 mb-10">
        <MessageSquare className="text-primary" size={24} />
        <h3 className="text-2xl font-black">댓글 <span className="text-primary">{comments.length}</span></h3>
      </div>

      <div className="space-y-4">
        {/* 상단 댓글 작성 폼 */}
        <MainCommentForm 
          user={user} 
          onSubmit={(content) => onCommentSubmit(content, null)} 
          isSubmitting={isSubmittingMain} 
        />

        {/* 댓글 목록 렌더링 */}
        <div className="space-y-2">
          {comments.length > 0 ? (
            comments.map(comment => (
              <CommentItem 
                key={comment.commentId} 
                comment={comment} 
                currentUser={user} 
                onDelete={onDeleteComment} 
                onUpdate={onUpdateComment} 
                onSubmitReply={onCommentSubmit} 
                activeReplyId={activeReplyId} 
                setActiveReplyId={setActiveReplyId} 
              />
            ))
          ) : (
            /* 빈 상태(Empty State) UI */
            <div className="py-20 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
              <MessageSquare size={40} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold">아직 작성된 댓글이 없습니다. ✨</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

export default CommentSection;
