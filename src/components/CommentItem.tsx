import React, { useState, useEffect, memo } from 'react';
import { 
  MessageSquare, Trash2, Pencil, User, Check, X, Reply 
} from 'lucide-react';
import { formatRelativeTime } from '../utils/dateUtils';

/**
 * [인터페이스] 댓글 객체의 데이터 구조 정의
 */
export interface Comment {
  commentId: number;        // 댓글 고유 ID
  userName: string;         // 작성자 이름
  userId: string;           // 작성자 아이디
  memberId: number;         // 작성자 고유 회원 번호
  profileImage?: string;    // 작성자 프로필 이미지 경로 (선택적)
  content: string;          // 댓글 본문 내용
  createAt: string;         // 생성 일시
  replies?: Comment[];      // 답글(대댓글) 목록
  parentCommentId?: number | null; // 부모 댓글 ID (답글인 경우에만 존재)
}

/**
 * [인터페이스] CommentItem 컴포넌트에 전달되는 속성(Props) 정의
 */
interface CommentItemProps {
  comment: Comment;               // 단일 댓글 데이터
  isReply?: boolean;              // 답글(대댓글) 여부 (true면 왼쪽 여백 및 아이콘 추가)
  currentUser: any;               // 현재 로그인한 사용자의 정보 (작성자 확인용)
  onDelete: (id: number) => void; // 댓글 삭제 실행 함수
  onUpdate: (id: number, content: string) => Promise<void>; // 댓글 수정 실행 함수
  onSubmitReply: (content: string, parentId: number) => Promise<boolean>; // 신규 답글 등록 함수
  activeReplyId: number | null;   // 현재 페이지에서 어떤 댓글의 답글 창이 열려있는지 추적
  setActiveReplyId: (id: number | null) => void; // 답글 창 열기/닫기 제어 함수
}

/**
 * [컴포넌트] 개별 댓글 렌더링 및 비즈니스 로직 처리
 * 
 * [최적화 - React.memo]
 * 댓글 목록이 많아질 경우, 하나의 댓글을 쓸 때 모든 댓글이 다시 그려지는 것을 방지하여
 * 쾌적한 입력 환경을 제공합니다.
 */
const CommentItem = memo(({ 
  comment, 
  isReply = false, 
  currentUser,
  onDelete,
  onUpdate,
  onSubmitReply,
  activeReplyId,
  setActiveReplyId
}: CommentItemProps) => {
  // 로컬 상태 관리: 수정 모드 여부, 수정 중인 내용, 답글 입력 내용, API 처리 중 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [localReplyContent, setLocalReplyContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 현재 사용자가 해당 댓글의 주인인지 판단 (수정/삭제 버튼 노출 기준)
  const canEdit = currentUser && String(currentUser.memberId) === String(comment.memberId);

  // 서버에서 댓글 데이터가 갱신되면(예: 다른 브라우저에서 수정) 로컬 수정 폼의 내용도 동기화
  useEffect(() => {
    setEditContent(comment.content);
  }, [comment.content]);

  /**
   * [핸들러] 댓글 수정 제출
   */
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

  /**
   * [핸들러] 답글(대댓글) 제출
   */
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localReplyContent.trim()) return;
    
    const success = await onSubmitReply(localReplyContent, comment.commentId);
    if (success) {
      setLocalReplyContent(''); // 입력창 비우기
      setActiveReplyId(null);   // 입력창 닫기
    }
  };

  /**
   * [유틸] 서버 프로필 이미지 경로 보정
   * 로컬 개발 환경과 실서버 환경의 이미지 경로 차이를 해결합니다.
   */
  const fixProfileUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const fileName = path.split(/[\\/]/).pop();
    return `/uploads/${fileName}`;
  };

  const profileUrl = fixProfileUrl(comment.profileImage);

  return (
    <div className={`${isReply ? 'ml-6 sm:ml-12 mt-4 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border-l-4 border-primary/20' : 'mb-8'}`}>
      <div className="flex gap-4 group">
        {/* 작성자 아바타 (이미지 없으면 기본 유저 아이콘) */}
        <div className={`rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-700 ${isReply ? 'w-8 h-8' : 'w-10 h-10'}`}>
          {profileUrl ? (
            <img src={profileUrl} alt="P" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <User size={isReply ? 14 : 18} />
            </div>
          )}
        </div>

        {/* 본문 영역 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              {/* 답글일 경우 꺾쇠 아이콘 표시 */}
              {isReply && <Reply size={12} className="text-primary rotate-180" />}
              <span className={`font-black text-slate-900 dark:text-white ${isReply ? 'text-xs' : 'text-sm'}`}>{comment.userName}</span>
              <span className="text-[10px] text-slate-400 font-bold">{formatRelativeTime(comment.createAt)}</span>
            </div>
            
            {/* 수정/삭제 관리 도구 (호버 시에만 표시하여 깔끔한 UI 유지) */}
            {canEdit && !isEditing && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="수정"><Pencil size={14} /></button>
                <button onClick={() => onDelete(comment.commentId)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="삭제"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            /* [수정 모드] 텍스트 에어리어와 확인/취소 버튼 */
            <div className="mt-2 space-y-2">
              <textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border-2 border-primary/20 rounded-xl p-3 text-sm focus:border-primary outline-none transition-all dark:text-white min-h-[80px] resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg" title="취소"><X size={16} /></button>
                <button onClick={handleUpdate} disabled={isProcessing} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg" title="저장"><Check size={16} /></button>
              </div>
            </div>
          ) : (
            /* [읽기 모드] 본문 텍스트와 답글 버튼 */
            <>
              <p className={`text-slate-700 dark:text-slate-300 leading-relaxed font-medium ${isReply ? 'text-xs' : 'text-sm'}`}>{comment.content}</p>
              {currentUser && !isReply && (
                <button 
                  onClick={() => setActiveReplyId(activeReplyId === comment.commentId ? null : comment.commentId)}
                  className="text-[10px] font-black text-primary mt-2 flex items-center gap-1 hover:text-blue-600 transition-colors uppercase tracking-tighter"
                >
                  <MessageSquare size={10} className="fill-primary/10" /> 답글
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* [답글 입력창] Reply 버튼 클릭 시 활성화 */}
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
              <button type="button" onClick={() => setActiveReplyId(null)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">취소</button>
              <button type="submit" disabled={isProcessing || !localReplyContent.trim()} className="px-6 py-2 bg-primary text-white text-xs font-black rounded-xl disabled:opacity-50 shadow-lg shadow-primary/20 hover:bg-blue-600 active:scale-95 transition-all">
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    저장 중...
                  </div>
                ) : '답글 등록'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* [재귀 호출] 대댓글 렌더링
          컴포넌트가 자기 자신을 호출하여 replies 배열이 있는 동안 계속해서 하위 답글을 그려냅니다. */}
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

export default CommentItem;
