import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string | null;
  onClose: () => void;
}

/**
 * 이미지 클릭 시 전체 화면으로 확대해서 보여주는 라이트박스 컴포넌트입니다.
 */
const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, onClose }) => {
  return (
    <AnimatePresence>
      {src && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={src} 
              alt="Original" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border-4 border-white/10" 
            />
            <div className="absolute -top-12 right-0 flex items-center gap-3">
              <button 
                onClick={onClose} 
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md border border-white/10" 
                title="닫기"
              >
                <X size={20} />
              </button>
            </div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/60 text-xs font-bold tracking-widest uppercase bg-black/20 px-4 py-1 rounded-full">
              Click outside to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
