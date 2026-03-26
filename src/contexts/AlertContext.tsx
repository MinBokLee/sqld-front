import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

type AlertType = 'success' | 'info' | 'warning' | 'error';

interface AlertOptions {
  type: AlertType;
  title?: string;
  message: string;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((newOptions: AlertOptions) => {
    setOptions(newOptions);
    setIsOpen(true);
  }, []);

  const hideAlert = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {isOpen && options && (
        <AlertModal 
          options={options} 
          onClose={hideAlert} 
        />
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};

// Internal Modal Component for better encapsulation
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

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
          
          {/* Icon Area */}
          <div className={`p-4 ${current.bg} ${current.color} rounded-2xl mb-6 shadow-inner`}>
            <Icon size={32} strokeWidth={2.5} />
          </div>

          {/* Text Area */}
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            {title || current.defaultTitle}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8 break-keep">
            {message}
          </p>

          {/* Confirm Button */}
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
