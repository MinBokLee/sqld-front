import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

type AlertType = 'success' | 'info' | 'warning' | 'error';

interface AlertOptions {
  type: AlertType;
  title?: string;
  message: string;
}

interface ToastItem {
  id: string;
  type: AlertType;
  message: string;
  duration?: number;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
  showToast: (message: string, type?: AlertType, duration?: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showAlert = useCallback((newOptions: AlertOptions) => {
    setOptions(newOptions);
    setIsOpen(true);
  }, []);

  const hideAlert = useCallback(() => {
    setIsOpen(false);
  }, []);

  const showToast = useCallback((message: string, type: AlertType = 'success', duration: number = 2500) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert, showToast }}>
      {children}
      
      {/* 1. Modal Alert (Blocking) */}
      {isOpen && options && (
        <AlertModal 
          options={options} 
          onClose={hideAlert} 
        />
      )}

      {/* 2. Toast Notifications (Non-blocking) */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-3 pointer-events-none w-full max-w-xs sm:max-w-sm px-6">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastComponent key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};

/**
 * [가벼운 알림] Toast Component
 */
const ToastComponent = ({ toast, onRemove }: { toast: ToastItem, onRemove: () => void }) => {
  const config = {
    success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-white dark:bg-[#1e293b]', border: 'border-emerald-500/20' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-white dark:bg-[#1e293b]', border: 'border-blue-500/20' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-white dark:bg-[#1e293b]', border: 'border-amber-500/20' },
    error: { icon: XCircle, color: 'text-rose-500', bg: 'bg-white dark:bg-[#1e293b]', border: 'border-rose-500/20' },
  };

  const current = config[toast.type];
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${current.border} ${current.bg} min-w-[280px]`}
    >
      <div className={`${current.color} shrink-0`}>
        <Icon size={20} strokeWidth={3} />
      </div>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 flex-1 line-clamp-2 leading-snug">
        {toast.message}
      </p>
      <button onClick={onRemove} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 transition-colors">
        <X size={16} />
      </button>
    </motion.div>
  );
};

/**
 * [중요 안내] Alert Modal (Internal)
 */
const AlertModal = ({ options, onClose }: { options: AlertOptions, onClose: () => void }) => {
  const { type, title, message } = options;

  const config = {
    success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', btn: 'bg-emerald-500 hover:bg-emerald-600', defaultTitle: '완료되었습니다' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', btn: 'bg-blue-500 hover:bg-blue-600', defaultTitle: '알림' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', btn: 'bg-amber-500 hover:bg-amber-600', defaultTitle: '확인해 주세요' },
    error: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', btn: 'bg-rose-500 hover:bg-rose-600', defaultTitle: '잠시 확인해 주세요' },
  };

  const current = config[type];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#1a222c] w-full max-w-[340px] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 flex flex-col items-center text-center">
          <div className={`p-4 ${current.bg} ${current.color} rounded-2xl mb-6 shadow-inner`}>
            <Icon size={32} strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            {title || current.defaultTitle}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8 break-keep">
            {message}
          </p>
          <button 
            onClick={onClose}
            className={`w-full py-4 rounded-2xl text-white font-black text-sm shadow-xl transition-all active:scale-95 ${current.btn}`}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
