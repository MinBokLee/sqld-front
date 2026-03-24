import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
	ClassicEditor,
	Alignment,
	Autoformat,
	AutoImage,
	Autosave,
	BlockQuote,
	Bold,
	CloudServices,
	Code,
	CodeBlock,
	Essentials,
	Heading,
	Highlight,
	HorizontalLine,
	Image,
	ImageCaption,
	ImageInsert,
	ImageResize,
	ImageStyle,
	ImageToolbar,
	ImageUpload,
	Indent,
	Italic,
	Link as CKLink,
	List,
	Paragraph,
	Table,
	TableToolbar,
	TableProperties,
	TableCellProperties,
	TextTransformation,
	Undo,
  FileRepository,
  FontColor,
  FontBackgroundColor,
  FontSize,
  FontFamily,
  MediaEmbed,
  HtmlEmbed,
  GeneralHtmlSupport,
  type EditorConfig
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { useAlert } from '../contexts/AlertContext';
import ConfirmModal from '../components/ConfirmModal';
import api from '../utils/api'; 
import { 
  Megaphone, BookOpen, Smile, Save, X, CloudUpload, 
  Info, ShieldCheck, Zap, ChevronsRight, MessageCircle, Lightbulb, HelpCircle, Hash, Download, ZoomIn, FileText
} from 'lucide-react';

class MyUploadAdapter {
  loader: any;
  accessToken: string;
  constructor(loader: any, accessToken: string) {
    this.loader = loader;
    this.accessToken = accessToken;
  }
  upload() {
    return this.loader.file.then((file: File) => new Promise((resolve, reject) => {
      const data = new FormData();
      data.append('upload', file);
      
      api.post(`/api/board/upload`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then(res => {
        const result = res.data;
        if (result.uploaded || result.upload) {
          resolve({ default: result.url });
        } else {
          reject(result.error?.message || '이미지 업로드 실패');
        }
      })
      .catch(() => reject('네트워크 오류'));
    }));
  }
  abort() {}
}

const ImageLightbox = ({ src, onClose }: { src: string | null, onClose: () => void }) => {
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

export default function WritePostPage() {
  const { user, clearUser, updateUser } = useUser();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null); 
  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

  const initialType = searchParams.get('type') || 'S';
  const initialCategory = searchParams.get('category') || 'question';
  const editingBoardId = searchParams.get('boardId');
  
  const [title, setTitle] = useState('');
  const [boardType, setBoardType] = useState(initialType);
  const [category, setCategory] = useState(initialCategory);
  const [editorData, setEditorData] = useState('');
  const [tag, setTag] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [tempData, setTempData] = useState<any>(null);
  
  const STORAGE_KEY = user ? `sqld_temp_post_${user.memberId}` : null;

  const fixImagePath = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const fileName = path.split(/[\\/]/).pop();
    return `/uploads/${fileName}`;
  };

  const fixContentHtml = (html: string) => {
    if (!html) return '';
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    let correctedHtml = html.replace(/src="http:\/\/localhost:8881\/uploads\//g, 'src="/uploads/');
    correctedHtml = correctedHtml.replace(new RegExp(`src="${API_BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/uploads/`, 'g'), 'src="/uploads/');
    correctedHtml = correctedHtml.replace(/src="[^"]*\/upload\/([^"]+)"/g, 'src="/uploads/$1');
    return correctedHtml;
  };

  const removeImageFromEditor = (imageSrc: string) => {
    if (!imageSrc) return;
    const fileName = imageSrc.split('/').pop();
    if (!fileName) return;

    setEditorData(prev => {
      const regex = new RegExp(`<figure[^>]*>.*?src=[^>]*${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*>.*?</figure>|<img[^>]*src=[^>]*${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*>`, 'gi');
      return prev.replace(regex, '');
    });

    if (editorRef.current) {
      const currentHtml = editorRef.current.getData();
      const regex = new RegExp(`<figure[^>]*>.*?src=[^>]*${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*>.*?</figure>|<img[^>]*src=[^>]*${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*>`, 'gi');
      const updatedHtml = currentHtml.replace(regex, '');
      editorRef.current.setData(updatedHtml);
    }
  };

  useEffect(() => {
    if (editingBoardId) {
       api.get(`/api/board/list/${editingBoardId}`)
       .then(res => {
         const post = res.data.result?.data;
         if (post) {
           setTitle(post.title || '');
           setBoardType(post.boardType || 'S');
           setCategory(post.category || 'question');
           const correctedHtml = fixContentHtml(post.content || '');
           setEditorData(correctedHtml);
           setTag(post.tagName || '');

           const files = post.fileList || post.boardFileList || post.files || [];
           setExistingFiles(files.map((f: any) => ({
             ...f,
             displayPath: fixImagePath(f.filePath || f.saveName || '')
           })));
         }
       })
       .catch(() => {
         showAlert({ type: 'error', message: "게시글을 불러올 수 없거나 권한이 없습니다. ⚠️" });
         navigate(-1);
       });
    } else if (STORAGE_KEY) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.title || parsed.content) {
            setTempData(parsed);
            setIsRestoreModalOpen(true);
          }
        } catch (e) { console.error('Failed to parse temp data'); }
      }
    }
  }, [editingBoardId, navigate, showAlert, STORAGE_KEY]);

  useEffect(() => {
    if (editingBoardId || !STORAGE_KEY) return; 
    const timer = setTimeout(() => {
      if (title || tag || boardType !== initialType) {
        const content = editorData;
        const current = localStorage.getItem(STORAGE_KEY);
        const base = current ? JSON.parse(current) : {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...base, title, content, boardType, category, tag, updatedAt: new Date().toISOString()
        }));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, boardType, category, tag, editorData, editingBoardId, initialType, STORAGE_KEY]);

  const handleRestore = () => {
    if (tempData) {
      setTitle(tempData.title || '');
      setBoardType(tempData.boardType || 'S');
      setCategory(tempData.category || 'question');
      setEditorData(tempData.content || '');
      setTag(tempData.tag || '');
      if (editorRef.current) editorRef.current.setData(tempData.content || '');
      showAlert({ type: 'success', message: "작성 중이던 내용을 복구했습니다. ✨" });
    }
    setIsRestoreModalOpen(false);
  };

  const handleDiscard = () => {
    if (STORAGE_KEY) localStorage.removeItem(STORAGE_KEY);
    setIsRestoreModalOpen(false);
  };

  useEffect(() => {
    if (!user) {
      showAlert({ type: 'warning', message: "로그인이 필요한 서비스입니다. ✅ 로그인 후 다시 시도해 주세요." });
      clearUser();
      navigate('/');
    }
  }, [user, navigate, clearUser, showAlert]);

  const uploadSingleFile = async (file: File) => {
    const data = new FormData();
    data.append('upload', file);
    const res = await api.post(`/api/board/upload`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const result = res.data;
    let url = result.url || result.result?.data?.[0];
    if (url.startsWith('/uploads') && !url.startsWith('/uploads/')) {
      url = url.replace('/uploads', '/uploads/');
    }
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let currentEditorContent = '';

    if (editorRef.current) {
      editorRef.current.editing.view.focus();
      await new Promise(resolve => setTimeout(resolve, 300));
      currentEditorContent = editorRef.current.getData();
    } else {
      currentEditorContent = editorData;
    }

    if (!title.trim() || !currentEditorContent.trim()) {
      showAlert({ type: 'warning', message: "입력되지 않은 내용이 있습니다. ⚠️ 제목과 내용을 모두 작성해 주세요." });
      return;
    }
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (editingBoardId) {
        formData.append('boardId', editingBoardId);
        if (deletedFileIds.length > 0) {
          deletedFileIds.forEach(id => formData.append('deleteFileIds', String(id)));
        }
      }
      formData.append('title', title);
      formData.append('content', currentEditorContent); 
      formData.append('boardType', boardType);
      formData.append('category', boardType === 'S' ? category : ''); 
      formData.append('tagName', tag);
      formData.append('memberId', user?.memberId || '');

      if (selectedFiles && selectedFiles.length > 0) {
        selectedFiles.forEach(file => { formData.append('files', file); });
      }
      
      const url = editingBoardId ? `/api/board/list/${editingBoardId}` : `/api/board/list/write`;
      const response = await api({
        method: editingBoardId ? 'put' : 'post',
        url: url,
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200 || response.status === 201) {
        if (STORAGE_KEY) localStorage.removeItem(STORAGE_KEY);
        if (boardType === 'G' && !editingBoardId) updateUser({ userStatus: 'Y' });
        showAlert({ type: 'success', message: "처리가 완료되었습니다. ✅" });
        const targetId = editingBoardId || response.data.result?.data?.boardId;
        if (targetId) {
          navigate(`/exam/${targetId}?type=${boardType}`, { replace: true });
        } else {
          navigate(`/practice-exams?type=${boardType}${boardType === 'S' ? `&category=${category}` : ''}`, { replace: true });
        }
      }
    } catch (error: any) {
      if (error.response?.status === 403) showAlert({ type: 'error', message: "수정 권한이 없습니다. ⚠️" });
      else showAlert({ type: 'error', message: "저장 중에 문제가 발생했어요. ⏳" });
    } finally { setIsSubmitting(false); }
  };

  const subCategories = [
    { id: 'question', label: getText('board.category.question'), icon: MessageCircle },
    { id: 'tip', label: getText('board.category.tip'), icon: Lightbulb },
    { id: 'faq', label: getText('board.category.faq'), icon: HelpCircle },
  ];

  const editorConfig: EditorConfig = {
    plugins: [
      Essentials, Paragraph, Heading, Bold, Italic, CKLink, List, BlockQuote, Image, 
      ImageUpload, FileRepository, Table, TableToolbar, TableProperties, TableCellProperties, Autoformat, AutoImage, 
      ImageCaption, ImageInsert, ImageResize, ImageStyle, ImageToolbar, Indent, 
      TextTransformation, Undo, Code, CodeBlock, Alignment, Highlight, HorizontalLine, CloudServices,
      FontColor, FontBackgroundColor, FontSize, FontFamily, MediaEmbed, HtmlEmbed, GeneralHtmlSupport, Autosave
    ],
    toolbar: [
      'heading', '|', 'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
      'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
      'alignment', 'highlight', 'horizontalLine', '|',
      'blockQuote', 'codeBlock', 'insertTable', 'uploadImage', 'mediaEmbed', '|', 'undo', 'redo'
    ],
    image: { 
      toolbar: [
        'imageStyle:inline', 'imageStyle:block', 'imageStyle:side', 
        '|', 
        'toggleImageCaption', 'imageTextAlternative',
        '|',
        'resizeImage:25', 'resizeImage:50', 'resizeImage:75', 'resizeImage:original', 
        '|',
        'linkImage'
      ],
      resizeOptions: [
        { name: 'resizeImage:original', value: null, label: 'Original' },
        { name: 'resizeImage:25', value: '25', label: '25%' },
        { name: 'resizeImage:50', value: '50', label: '50%' },
        { name: 'resizeImage:75', value: '75', label: '75%' }
      ],
      resizeUnit: '%'
    },
    table: { 
      contentToolbar: [
        'tableColumn', 'tableRow', 'mergeTableCells', 
        '|', 
        'tableProperties', 'tableCellProperties',
        '|',
        'alignment'
      ]
    },
    codeBlock: {
      languages: [
        { language: 'sql', label: 'SQL (SQLD)' },
        { language: 'javascript', label: 'JavaScript' },
        { language: 'python', label: 'Python' },
        { language: 'plaintext', label: 'Plain text' }
      ]
    },
    htmlSupport: {
      allow: [
        { name: /.*/, attributes: true, classes: true, styles: true } 
      ]
    },
    placeholder: '내용을 입력하세요...',
    licenseKey: 'GPL',
  };

  /**
   * [영구 해결] 코드 블록 커서 갇힘 방지 핸들러
   * Shift + Enter를 누르면 코드 블록 밖으로 즉시 탈출합니다.
   */
  const handleEditorReady = (editor: any) => {
    editorRef.current = editor;
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => new MyUploadAdapter(loader, user?.accessToken || '');

    // 키보드 리스너 직접 주입 (엔진 레벨 탈출 로직)
    editor.editing.view.document.on('keydown', (evt: any, data: any) => {
      // Shift + Enter 감지
      if (data.keyCode === 13 && data.shiftKey) {
        const selection = editor.model.document.selection;
        const position = selection.getFirstPosition();
        
        // 현재 커서가 코드 블록 내부에 있는지 확인
        const codeBlock = position.findAncestor('codeBlock');
        if (codeBlock) {
          editor.model.change((writer: any) => {
            // 코드 블록 바로 다음에 일반 문단(Paragraph) 삽입
            const paragraph = writer.createElement('paragraph');
            writer.insert(paragraph, writer.createPositionAfter(codeBlock));
            // 커서를 새로 만든 문단으로 강제 이동
            writer.setSelection(paragraph, 'end');
          });
          evt.stop(); // 기본 엔터 동작 중단
          data.preventDefault();
        }
      }
    }, { priority: 'high' });
  };

  return (
    <div className="bg-slate-50 dark:bg-[#0d141b] min-h-screen font-sans">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link to="/" className="hover:text-primary transition-colors font-medium">{getText('common.home')}</Link>
          <ChevronsRight size={14} />
          <span className="text-slate-600 dark:text-slate-200 font-bold">{editingBoardId ? '글 수정' : '새 글 작성'}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9 space-y-6">
            <div className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 sm:p-10 border-b border-slate-50 dark:border-slate-800">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{editingBoardId ? '게시글 수정하기' : '새로운 게시글 작성'}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">유용한 지식과 경험을 커뮤니티에 공유해 보세요.</p>
              </div>

              <div className="p-6 sm:p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">게시판 선택</label>
                  <div className="flex flex-wrap p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-fit gap-1">
                    {[
                      { id: 'N', label: getText('board.notice'), icon: Megaphone, adminOnly: true },
                      { id: 'S', label: getText('board.sqld_study'), icon: BookOpen, adminOnly: false },
                      { id: 'G', label: getText('board.join_greetings'), icon: Smile, adminOnly: false },
                    ].filter(cat => !cat.adminOnly || user?.userRole === 'ADMIN').map((cat) => (
                      <label key={cat.id} className="cursor-pointer">
                        <input className="peer sr-only" name="boardType" type="radio" checked={boardType === cat.id} onChange={() => { setBoardType(cat.id); if (cat.id !== 'S') setTag(''); }} />
                        <div className="px-6 py-3 rounded-xl text-sm font-black text-slate-500 peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-primary peer-checked:shadow-sm transition-all flex items-center gap-2">
                          <cat.icon size={16} /> {cat.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {boardType === 'S' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">카테고리 설정</label>
                    <div className="flex flex-wrap gap-2">
                      {subCategories.map((sub) => (
                        <label key={sub.id} className="cursor-pointer">
                          <input className="peer sr-only" name="category" type="radio" checked={category === sub.id} onChange={() => setCategory(sub.id)} />
                          <div className="px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all flex items-center gap-2">
                            <sub.icon size={16} /> {sub.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">제목</label>
                  <input className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none text-xl font-black focus:ring-2 focus:ring-primary/20 transition-all dark:text-white" placeholder="제목을 입력하세요" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                {boardType === 'S' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500 delay-100">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Hash size={14} className="text-primary" /> 해시태그 (쉼표로 구분)</label>
                    <div className="relative group">
                      <input className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl outline-none text-sm font-bold focus:border-primary/20 focus:bg-white dark:focus:bg-slate-700 transition-all dark:text-white" placeholder="예: SQLD, 서브쿼리, JOIN" type="text" value={tag} onChange={(e) => setTag(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">내용</label>
                  <div className="ck-editor-container border-none dark:text-slate-900">
                    <style dangerouslySetInnerHTML={{ __html: `
                      .ck-editor__editable { min-height: 500px !important; border-radius: 0 0 1.5rem 1.5rem !important; padding: 1.5rem 2rem !important; border: none !important; background: #f8fafc !important; }
                      .ck-toolbar { border: none !important; background: #f1f5f9 !important; border-radius: 1.5rem 1.5rem 0 0 !important; padding: 0.5rem 1rem !important; }
                      .ck-content figure.table { margin: 1.5rem 0 !important; width: 100% !important; }
                      .ck-content figure.table table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #cbd5e1 !important; }
                      .ck-content figure.table td, .ck-content figure.table th { border: 1px solid #cbd5e1 !important; padding: 0.5rem !important; min-width: 50px !important; }
                      .ck-content figure.table th { background-color: #f1f5f9 !important; font-weight: bold !important; }
                      .ck-content pre { background: #282c34 !important; color: #abb2bf !important; font-family: 'Fira Code', monospace !important; padding: 1.5rem !important; border-radius: 1rem !important; margin: 1.5rem 0 !important; }
                      .ck-content .image img { max-width: 60% !important; margin: 2rem auto !important; display: block !important; border-radius: 1rem !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; transition: all 0.3s ease; }
                      .ck-widget__selection-handle { display: none !important; } 
                    `}} />
                    <CKEditor
                      editor={ClassicEditor}
                      config={editorConfig}
                      data={editorData}
                      onReady={handleEditorReady}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        setEditorData(data);
                      }}
                      onBlur={(event, editor) => {
                        const data = editor.getData();
                        setEditorData(data);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">이미지 추가 첨부 (선택)</label>
                  <div 
                    className={`flex h-40 w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed transition-all cursor-pointer ${isDragOver ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50 dark:bg-slate-800/30'}`} 
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} 
                    onDragLeave={() => setIsDragOver(false)} 
                    onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files) setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }} 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm"><CloudUpload className="w-8 h-8 text-primary" /></div>
                    <p className="text-sm text-slate-500 font-bold">이미지를 드래그하거나 클릭하여 추가 업로드하세요.</p>
                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => { if (e.target.files) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} />
                  </div>
                  
                  {existingFiles.filter(f => !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.originName)).length > 0 && (
                    <div className="space-y-3 mt-8 animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-3 bg-blue-400 rounded-full" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">기존 첨부 파일 <span className="text-blue-500">{existingFiles.filter(f => !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.originName)).length}</span></h4>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                        {existingFiles.filter(f => !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.originName)).map((file, index) => {
                          return (
                            <div key={`existing-${index}`} className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="aspect-square w-full overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center relative">
                                <div className="flex flex-col items-center gap-1 text-slate-400">
                                  <FileText size={20} />
                                  <span className="text-[7px] font-bold uppercase">{file.originName.split('.').pop()}</span>
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                  <a 
                                    href={`/api/board/download/${file.fileId}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 bg-white/20 hover:bg-white/40 text-white rounded-md backdrop-blur-md transition-all active:scale-90"
                                    title="다운로드"
                                  >
                                    <Download size={12} />
                                  </a>
                                  <button 
                                    type="button" 
                                    onClick={(e) => { 
                                      e.preventDefault(); 
                                      e.stopPropagation(); 
                                      setDeletedFileIds(prev => [...prev, file.fileId]);
                                      setExistingFiles(prev => prev.filter(f => f.fileId !== file.fileId));
                                    }} 
                                    className="p-1 bg-rose-500/60 hover:bg-red-600 text-white rounded-md backdrop-blur-md transition-all active:scale-90"
                                    title="삭제"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                              <div className="p-1.5 bg-blue-50/50 dark:bg-blue-900/20">
                                <p className="text-[8px] font-bold text-blue-600 dark:text-blue-400 truncate text-center" title={file.originName}>{file.originName}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedFiles.filter(f => !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name)).length > 0 && (
                    <div className="space-y-3 mt-8 animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-3 bg-primary rounded-full" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">새로 추가할 파일 <span className="text-primary">{selectedFiles.filter(f => !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name)).length}</span></h4>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                        {selectedFiles.filter(f => !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name)).map((file, index) => {
                          return (
                            <div key={index} className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300">
                              <div className="aspect-square w-full overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center relative">
                                <div className="flex flex-col items-center gap-1 text-slate-400">
                                  <FileText size={20} />
                                  <span className="text-[7px] font-bold uppercase">{file.name.split('.').pop()}</span>
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                  <button 
                                    type="button" 
                                    onClick={(e) => { 
                                      e.preventDefault(); 
                                      e.stopPropagation(); 
                                      setSelectedFiles(prev => prev.filter(f => f !== file)); 
                                    }} 
                                    className="p-1 bg-red-500/60 hover:bg-red-600 text-white rounded-md backdrop-blur-md transition-all active:scale-90"
                                    title="삭제"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                              <div className="p-1.5 bg-slate-50 dark:bg-slate-800/80">
                                <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 truncate text-center" title={file.name}>{file.name}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-10 flex items-center justify-end gap-4 border-t border-slate-50 dark:border-slate-800">
                  <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 rounded-2xl text-slate-500 font-black hover:bg-slate-100 transition-all uppercase tracking-widest text-xs">취소</button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="px-10 py-4 rounded-2xl bg-primary text-white font-black hover:bg-blue-600 shadow-xl shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest text-xs">{isSubmitting ? '처리 중...' : editingBoardId ? '수정 완료' : '게시하기'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ConfirmModal isOpen={isRestoreModalOpen} onClose={handleDiscard} onConfirm={handleRestore} title="작성 중인 글 복구" message="이전에 작성하던 내용이 발견되었습니다. 불러와서 계속 작성하시겠습니까?" type="info" />
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
