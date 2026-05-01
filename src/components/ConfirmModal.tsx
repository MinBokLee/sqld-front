import React, { useEffect } from 'react';
import { X, AlertTriangle, HelpCircle, ShieldAlert, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  type = 'info',
  isLoading = false
}) => {
  // 엔터키 및 ESC 지원 로직
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onConfirm(); 
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose(); 
      }
    };
    
    // capture: true를 통해 다른 이벤트보다 우선적으로 처리
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onConfirm, onClose]);

  // 배경 스크롤 방지 로직
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const themes = {
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: <Trash2 size={40} className="text-red-500" />,
      btn: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
      border: 'border-red-100 dark:border-red-900/30'
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: <AlertTriangle size={40} className="text-amber-500" />,
      btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
      border: 'border-amber-100 dark:border-amber-900/30'
    },
    info: {
      bg: 'bg-primary/10',
      icon: <ShieldAlert size={40} className="text-primary" />,
      btn: 'bg-primary hover:bg-blue-600 shadow-primary/20',
      border: 'border-primary/10'
    }
  };

  const theme = themes[type];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-10 pb-4 flex flex-col items-center">
          <div className={`w-20 h-20 ${theme.bg} rounded-full flex items-center justify-center mb-6 shadow-inner`}>
            {theme.icon}
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-black tracking-tight px-6 text-center">{title}</h2>
        </div>

        <div className="px-8 pb-10">
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center leading-relaxed font-medium mb-10 whitespace-pre-line">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-4 rounded-2xl font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 text-sm"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-6 py-4 rounded-2xl font-black text-white ${theme.btn} shadow-xl transition-all active:scale-95 disabled:opacity-50 text-sm`}
            >
              {isLoading ? '처리 중...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
