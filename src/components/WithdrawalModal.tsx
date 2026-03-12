import React from 'react';
import { X, AlertTriangle, Info, UserMinus, ShieldAlert } from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header/Icon */}
        <div className="pt-10 pb-4 flex flex-col items-center">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <UserMinus size={40} className="text-red-500" />
          </div>
          <h2 className="text-slate-900 dark:text-white text-2xl font-black tracking-tight">회원 탈퇴 안내</h2>
        </div>

        {/* Modal Content */}
        <div className="px-8 pb-10">
          <div className="space-y-5 text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium">
            <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <ShieldAlert size={20} className="text-red-500 flex-shrink-0" />
              <p>회원 탈퇴 시 계정 정보는 <span className="font-black text-red-600 dark:text-red-400">즉시 삭제</span>되며 복구할 수 없습니다.</p>
            </div>
            
            <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <Info size={20} className="text-blue-500 flex-shrink-0" />
              <p>작성하신 게시글 및 댓글은 삭제되지 않으며, 작성자는 <span className="inline-block px-1.5 py-0.5 bg-primary/10 rounded font-black text-primary text-xs">"탈퇴한 회원"</span>으로 표시됩니다.</p>
            </div>
            
            <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
              <p>탈퇴 후에는 <span className="font-black text-slate-900 dark:text-white">동일한 계정으로의 복구</span>가 불가능합니다.</p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-900 dark:text-white font-black text-lg mb-8">정말 탈퇴하시겠습니까?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 text-sm"
              >
                취소
              </button>
              <button 
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-6 py-4 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 text-sm"
              >
                {isLoading ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalModal;
