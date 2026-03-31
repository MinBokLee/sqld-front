import React, { memo } from 'react';
import { FileText, Download, Paperclip } from 'lucide-react';

/**
 * [인터페이스] 첨부파일 객체의 데이터 구조 정의
 * 외부 파일에서 타입을 참조할 수 있도록 명시적으로 export 합니다.
 */
export interface Attachment {
  fileId: number;    // 서버에서 관리하는 파일 고유 ID
  originName: string; // 원본 파일명 (사용자에게 노출됨)
  filePath: string;   // 파일 접근 경로 (미리보기 등에서 사용)
}

/**
 * [인터페이스] AttachmentSection 컴포넌트에 전달되는 속성(Props) 정의
 */
interface AttachmentSectionProps {
  files: Attachment[];                  // 첨부파일 배열 데이터
  onImageClick: (url: string) => void;   // 이미지 클릭 시 확대(Lightbox) 처리 함수
  onDownload: (id: number, name: string) => void; // 다운로드 버튼 클릭 시 처리 함수 (Axios/Blob 기반)
}

/**
 * [컴포넌트] 게시글 상세 페이지 하단의 첨부파일 목록 영역
 * 
 * [최적화 - React.memo]
 * 게시글 본문이나 댓글이 입력될 때 부모 컴포넌트가 리렌더링되는데,
 * 첨부파일 데이터가 변경되지 않았다면 이 컴포넌트는 다시 그리지 않고
 * 이전 결과를 재사용하여 렌더링 성능을 높입니다.
 */
const AttachmentSection = memo(({ files, onImageClick, onDownload }: AttachmentSectionProps) => {
  // 첨부파일이 없으면 영역 자체를 표시하지 않음 (방어적 렌더링)
  if (!files || files.length === 0) return null;
  
  return (
    <div className="px-6 sm:px-10 py-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
      {/* 영역 헤더: 아이콘 및 파일 개수 표시 */}
      <div className="flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
        <Paperclip size={18} className="text-primary" />
        <h4 className="text-sm font-black uppercase tracking-widest">
          첨부파일 <span className="text-primary ml-1">{files.length}</span>
        </h4>
      </div>

      {/* 파일 목록 그리드: 모바일 1열, PC 2열 배치 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {files.map((file, idx) => {
          // 정규표현식을 사용하여 이미지 파일 여부 판별 (미리보기 처리용)
          const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.originName);
          
          return (
            <div 
              key={idx} 
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary/30 hover:shadow-md transition-all group cursor-default"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* 왼쪽 영역: 파일 타입 아이콘 또는 이미지 미리보기 */}
                <div 
                  className={`w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-600 transition-all ${isImage ? 'cursor-zoom-in hover:scale-105 hover:border-primary/50' : ''}`} 
                  onClick={() => isImage && onImageClick(file.filePath)}
                >
                  {isImage ? (
                    <img src={file.filePath} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <FileText size={18} />
                  )}
                </div>

                {/* 중앙 영역: 파일명 및 이미지인 경우 안내 텍스트 */}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {file.originName}
                  </span>
                  {isImage && (
                    <span className="text-[10px] text-primary/60 font-medium">클릭하여 확대</span>
                  )}
                </div>
              </div>

              {/* 오른쪽 영역: 다운로드 버튼 (호버 시 파란색으로 강조) */}
              <button 
                onClick={() => onDownload(file.fileId, file.originName)}
                className="p-2 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all" 
                title="다운로드"
              >
                <Download size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default AttachmentSection;
