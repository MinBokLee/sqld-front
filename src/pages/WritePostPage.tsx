import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams, Link, replace } from 'react-router-dom';
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
	TableColumnResize,
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
  Plugin,
  ButtonView,
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
  Info, ShieldCheck, Zap, ChevronsRight, ChevronRight, MessageCircle, Lightbulb, HelpCircle, Hash, Download, ZoomIn, FileText, Trash2, File,
  ArrowLeft
} from 'lucide-react';

/**
 * [커스텀 플러그인] TableColumnWidthEqualizer
 * 표의 모든 열 너비를 균등하게 (N분의 1) 맞춰주는 기능을 제공합니다.
 */
class TableColumnWidthEqualizer extends Plugin {
  init() {
    const editor = this.editor;
    editor.ui.componentFactory.add('tableColumnWidthEqualizer', locale => {
      const view = new ButtonView(locale);
      view.set({
        label: '모든 칸 너비 동일하게',
        icon: '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M3 4h14v2H3V4zm0 5h14v2H3V9zm0 5h14v2H3v-2zM2 2h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/></svg>',
        tooltip: true
      });
      this.listenTo(view, 'execute', () => {
        editor.model.change(writer => {
          const selection = editor.model.document.selection;
          const table = selection.getFirstPosition()?.findAncestor('table');
          if (table) {
            const rows = Array.from(table.getChildren());
            if (rows.length > 0) {
              const firstRow = rows[0] as any;
              const cells = Array.from(firstRow.getChildren());
              const colCount = cells.length;
              const equalWidth = (100 / colCount).toFixed(2) + '%';
              for (const row of rows) {
                for (const cell of (row as any).getChildren()) {
                  writer.setAttribute('width', equalWidth, cell);
                }
              }
              writer.setAttribute('alignment', 'center', table);
            }
          }
        });
      });
      return view;
    });
  }
}

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
            <img src={src} alt="Original" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border-4 border-white/10" />
            <div className="absolute -top-12 right-0 flex items-center gap-3">
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md border border-white/10" title="닫기" >
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
  const { user, clearUser, updateUser, isLoading: isUserLoading } = useUser();
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
  const [isBackConfirmOpen, setIsBackConfirmOpen] = useState(false);
  const [tempData, setTempData] = useState<any>(null);
  
  const isSuccessfullySubmitted = useRef(false);
  const STORAGE_KEY = user ? `sqld_temp_post_${user.memberId}${editingBoardId ? `_${editingBoardId}` : ''}` : null;

  const handleConfirmBack = () => {
    setIsBackConfirmOpen(false);
    isSuccessfullySubmitted.current = true;
    
    // [핵심] '수정 페이지'와 '가짜 상태' 2개를 모두 건너뛰어 원래의 상세 페이지 지점으로 돌아갑니다.
    // 이렇게 하면 상세 페이지에서 뒤로가기를 눌렀을 때 수정 페이지가 아닌 리스트/메인이 나옵니다.
    window.history.go(-2);
  };

  const handleCancelClick = () => {
    const { title, content } = lastContent.current;
    if (title.trim() || content.trim()) {
      setIsBackConfirmOpen(true);
    } else {
      isSuccessfullySubmitted.current = true;
      // 내용이 없더라도 스택 정리를 위해 2칸 뒤로 이동합니다.
      window.history.go(-2);
    }
  };

  const fixImagePath = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const fileName = path.split(/[\\/]/).pop();
    return `/uploads/${fileName}`;
  };

  const fixContentHtml = (html: string) => {
    if (!html) return '';
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    let correctedHtml = html.replace(/src="https?:\/\/[^/]+\/uploads\//g, 'src="/uploads/');
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
           setExistingFiles(files.map((f: any) => ({ ...f, displayPath: fixImagePath(f.filePath || f.saveName || '') })));
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
          if (parsed.title || parsed.content) { setTempData(parsed); setIsRestoreModalOpen(true); }
        } catch (e) { console.error('Failed to parse temp data'); }
      }
    }
  }, [editingBoardId, navigate, showAlert, STORAGE_KEY]);

  const lastContent = useRef({title: '', content: ''});
  
  //1. 최신 데이터 업데이트 (항상 최상위)
  lastContent.current = {title, content:editorData};

  useEffect(()=> {
    //1. 브라우저 탭 닫기 방지
    const handleBeforeUnload= (e: BeforeUnloadEvent) => {
      const{title, content} = lastContent.current;
      if(!isSuccessfullySubmitted.current && (title.trim() || content.trim())) {
          e.preventDefault(); e.returnValue='';
      }
    };
    //2. 뒤로 가기 방지 핵심 로직
    const handlePopState = () =>{
      const{title, content} = lastContent.current;
      if(!isSuccessfullySubmitted.current && (title.trim() || content.trim())){
        setIsBackConfirmOpen(true);
        // 가짜 상태를 다시 밀어넣어 현재 페이지 유지 (브라우저의 뒤로가기 동작을 상쇄함)
        window.history.pushState({ preventBack: true }, '', window.location.href);
      }      
    };// end of handlePopState()
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // [핵심 수정] 페이지 진입 시 딱 한 번만 가짜 상태를 추가합니다. (중복 생성 방지)
    if(window.history.state?.preventBack !== true){
      window.history.pushState({preventBack:true},'', window.location.href);
    }

    return() => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  
  }, []); // 의존성 배열을 비워 마운트 시 1회만 실행되도록 보장합니다.

  useEffect(() => {
    if (isUserLoading) return; // 로그인 정보 복구 중에는 체크를 대기함

    if (!user) {
      showAlert({ type: 'warning', message: "로그인이 필요한 서비스입니다. ✅" });
      navigate('/');
    }
  }, [user, isUserLoading, navigate, showAlert]);

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

  const uploadSingleFile = async (file: File) => {
    const data = new FormData();
    data.append('upload', file);
    const res = await api.post(`/api/board/upload`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    const result = res.data;
    let url = result.url || result.result?.data?.[0];
    if (url.startsWith('/uploads') && !url.startsWith('/uploads/')) url = url.replace('/uploads', '/uploads/');
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let currentEditorContent = '';
    if (editorRef.current) {
      editorRef.current.editing.view.focus();
      await new Promise(resolve => setTimeout(resolve, 300));
      currentEditorContent = editorRef.current.getData();
    } else { currentEditorContent = editorData; }

    if (!title.trim() || !currentEditorContent.trim()) {
      showAlert({ type: 'warning', message: "내용을 입력해 주세요. ⚠️" }); return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (editingBoardId) {
        formData.append('boardId', editingBoardId);
        if (deletedFileIds.length > 0) deletedFileIds.forEach(id => formData.append('deleteFileIds', String(id)));
      }
      formData.append('title', title);
      formData.append('content', currentEditorContent); 
      formData.append('boardType', boardType);
      formData.append('category', boardType === 'S' ? category : ''); 
      formData.append('tagName', tag);
      formData.append('memberId', user?.memberId || '');
      if (selectedFiles && selectedFiles.length > 0) selectedFiles.forEach(file => formData.append('files', file));
      
      const url = editingBoardId ? `/api/board/list/${editingBoardId}` : `/api/board/list/write`;
      const response = await api({ method: editingBoardId ? 'put' : 'post', url: url, data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.status === 200 || response.status === 201) {
        isSuccessfullySubmitted.current = true;
        if (STORAGE_KEY) localStorage.removeItem(STORAGE_KEY);
        if (boardType === 'G' && !editingBoardId) updateUser({ userStatus: 'Y' });
        showAlert({ type: 'success', message: "처리가 완료되었습니다. ✅" });
        const targetId = editingBoardId || response.data.result?.data?.boardId;
        if (targetId) navigate(`/exam/${targetId}?type=${boardType}`, { replace: true });
        else navigate(`/practice-exams?type=${boardType}${boardType === 'S' ? `&category=${category}` : ''}`, { replace: true });
      }
    } catch (error: any) { showAlert({ type: 'error', message: "저장 실패 ⏳" }); } finally { setIsSubmitting(false); }
  };

  const subCategories = [
    { id: 'question', label: getText('board.category.question'), icon: MessageCircle },
    { id: 'tip', label: getText('board.category.tip'), icon: Lightbulb },
    { id: 'faq', label: getText('board.category.faq'), icon: HelpCircle },
  ];

  const editorConfig: EditorConfig = {
    plugins: [
      Essentials, Paragraph, Heading, Bold, Italic, CKLink, List, BlockQuote, Image, 
      ImageUpload, FileRepository, Table, TableToolbar, TableProperties, TableCellProperties, TableColumnResize, Autoformat, AutoImage, 
      ImageInsert, ImageResize, ImageStyle, ImageToolbar, Indent, 
      TextTransformation, Undo, Code, CodeBlock, Alignment, Highlight, HorizontalLine, CloudServices,
      FontColor, FontBackgroundColor, FontSize, FontFamily, MediaEmbed, HtmlEmbed, GeneralHtmlSupport, Autosave,
      TableColumnWidthEqualizer
    ],
    toolbar: [
      'heading', '|', 'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
      'bold', 'bulletedList', 'numberedList', 'alignment', 'highlight', '|',
      'uploadImage', 'insertTable', 'codeBlock', '|', // [핵심] 3대 핵심 도구 전면 배치
      'undo', 'redo'
    ],
    image: { 
      toolbar: ['imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|', 'imageTextAlternative', '|', 'resizeImage:25', 'resizeImage:50', 'resizeImage:75', 'resizeImage:original', '|', 'linkImage'],
      resizeOptions: [{ name: 'resizeImage:original', value: null, label: 'Original' }, { name: 'resizeImage:25', value: '25', label: '25%' }, { name: 'resizeImage:50', value: '50', label: '50%' }, { name: 'resizeImage:75', value: '75', label: '75%' }],
      resizeUnit: '%'
    },
    table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', '|', 'tableProperties', 'tableCellProperties', '|', 'alignment', 'tableColumnWidthEqualizer'] },
    codeBlock: { languages: [{ language: 'sql', label: 'SQL (SQLD)' }, { language: 'javascript', label: 'JavaScript' }, { language: 'python', label: 'Python' }, { language: 'plaintext', label: 'Plain text' }] },
    htmlSupport: { allow: [{ name: /.*/, attributes: true, classes: true, styles: true }] },
    placeholder: '내용을 입력하세요...',
    licenseKey: 'GPL',
  };

  const handleEditorReady = (editor: any) => {
    editorRef.current = editor;
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => new MyUploadAdapter(loader, user?.accessToken || '');
    editor.editing.view.document.on('keydown', (evt: any, data: any) => {
      if (data.keyCode === 13 && data.shiftKey) {
        const selection = editor.model.document.selection;
        const position = selection.getFirstPosition();
        const codeBlock = position.findAncestor('codeBlock');
        if (codeBlock) {
          editor.model.change((writer: any) => {
            const paragraph = writer.createElement('paragraph');
            writer.insert(paragraph, writer.createPositionAfter(codeBlock));
            writer.setSelection(paragraph, 'end');
          });
          evt.stop(); data.preventDefault();
        }
      }
    }, { priority: 'high' });
  };

  const handleFileDownload = async (fileId: number, fileName: string) => {
    try {
      const response = await api.get(`/api/board/download/${fileId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', fileName);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) { console.error("Download error:", error); }
  };

  const isImageFile = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);

  return (
    <div className="bg-slate-50 dark:bg-[#0d141b] min-h-screen font-sans">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link to="/" className="hover:text-primary transition-colors font-medium">{getText('common.home')}</Link>
          <ChevronsRight size={14} /><span className="text-slate-600 dark:text-slate-200 font-bold">{editingBoardId ? '글 수정' : '새 글 작성'}</span>
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
                      .ck-content figure.table { margin: 1.5rem 0 !important; display: table !important; width: auto !important; max-width: 100% !important; }
                      .ck-content figure.table table { border-collapse: collapse !important; border: 1px solid #cbd5e1 !important; table-layout: fixed !important; width: 100% !important; min-width: 50px !important; }
                      .ck-content figure.table td, .ck-content figure.table th { border: 1px solid #cbd5e1 !important; padding: 0.75rem !important; word-break: break-all !important; overflow-wrap: break-word !important; }
                      .ck-content .ck-table-column-resizer { width: 8px !important; background-color: rgba(59, 130, 246, 0.2) !important; transition: background-color 0.2s; }
                      .ck-content .ck-table-column-resizer:hover { background-color: rgba(59, 130, 246, 0.8) !important; }
                      .ck-content figure.table th { background-color: #f1f5f9 !important; font-weight: bold !important; }
                      .ck-content figure.table.table-align-left { margin-left: 0 !important; margin-right: auto !important; }
                      .ck-content figure.table.table-align-right { margin-left: auto !important; margin-right: 0 !important; }
                      .ck-content figure.table.table-align-center { margin-left: auto !important; margin-right: auto !important; }
                      .ck-content pre { background: #282c34 !important; color: #abb2bf !important; font-family: 'Fira Code', monospace !important; padding: 1.5rem !important; border-radius: 1rem !important; margin: 1.5rem 0 !important; }
                      .ck-content .image { margin: 2rem 0; clear: both; display: table; transition: all 0.3s ease; }
                      .ck-content .image img { display: block; max-width: 100%; min-width: 50px; border-radius: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                      .ck-content .image-style-align-left { float: left; margin-right: 1.5rem; margin-left: 0; max-width: 50%; }
                      .ck-content .image-style-align-right { float: right; margin-left: 1.5rem; margin-right: 0; max-width: 50%; }
                      .ck-content .image-style-align-center { margin-left: auto !important; margin-right: auto !important; float: none !important; display: table !important; }
                      .ck-content .image-style-block-align-left { margin-left: 0 !important; margin-right: auto !important; float: none !important; display: table !important; }
                      .ck-content .image-style-block-align-right { margin-right: 0 !important; margin-left: auto !important; float: none !important; display: table !important; }
                      .ck-content .image-style-side { float: right; margin-left: 1.5rem; max-width: 50%; }
                      .ck-widget__selection-handle { display: none !important; } 
                    `}} />
                    <CKEditor
                      editor={ClassicEditor}
                      config={editorConfig}
                      data={editorData}
                      onReady={handleEditorReady}
                      onChange={(event, editor) => setEditorData(editor.getData())}
                      onBlur={(event, editor) => setEditorData(editor.getData())}
                    />
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">미디어 및 첨부파일</label>
                    <span className="text-[10px] font-bold text-slate-400">최대 50MB까지 업로드 가능</span>
                  </div>
                  <div 
                    className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group ${isDragOver ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50 dark:bg-slate-800/30 dark:border-slate-700 hover:border-primary hover:bg-primary/5'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} 
                    onDragLeave={() => setIsDragOver(false)} 
                    onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files) setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }} 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors"><CloudUpload size={32} /></div>
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200">파일을 여기에 드래그하거나 클릭하여 업로드</p>
                      <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tighter">PNG, JPG, PDF, ZIP (MAX 10MB EACH)</p>
                    </div>
                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => { if (e.target.files) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} />
                  </div>

                  {(existingFiles.filter(f => isImageFile(f.originName)).length > 0 || selectedFiles.filter(f => isImageFile(f.name)).length > 0) && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1 h-3 bg-primary rounded-full" />이미지 라이브러리</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {existingFiles.filter(f => isImageFile(f.originName)).map((file, idx) => (
                          <div key={`ex-img-${idx}`} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50">
                            <img src={file.displayPath} alt="prev" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxSrc(file.displayPath); }} className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-md transition-all active:scale-90"><ZoomIn size={16} /></button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); removeImageFromEditor(file.displayPath); setDeletedFileIds(prev => [...prev, file.fileId]); setExistingFiles(prev => prev.filter(f => f.fileId !== file.fileId)); }} className="p-2 bg-rose-500/60 hover:bg-red-600 text-white rounded-xl backdrop-blur-md transition-all active:scale-90"><X size={16} /></button>
                            </div>
                          </div>
                        ))}
                        {selectedFiles.filter(f => isImageFile(f.name)).map((file, idx) => {
                          const url = URL.createObjectURL(file);
                          return (
                            <div key={`new-img-${idx}`} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50">
                              <img src={url} alt="prev" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxSrc(url); }} className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-md transition-all active:scale-90"><ZoomIn size={16} /></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); removeImageFromEditor(url); setSelectedFiles(prev => prev.filter(f => f !== file)); }} className="p-2 bg-rose-500/60 hover:bg-red-600 text-white rounded-xl backdrop-blur-md transition-all active:scale-90"><X size={16} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(existingFiles.filter(f => !isImageFile(f.originName)).length > 0 || selectedFiles.filter(f => !isImageFile(f.name)).length > 0) && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1 h-3 bg-blue-400 rounded-full" />기타 문서 파일</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {existingFiles.filter(f => !isImageFile(f.originName)).map((file, idx) => (
                          <div key={`ex-file-${idx}`} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:shadow-md transition-all group">
                            <div className="w-10 h-10 flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center"><FileText size={20} /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate">{file.originName}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Existing File</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleFileDownload(file.fileId, file.originName)} className="p-2 text-slate-300 hover:text-primary transition-colors" title="다운로드"><Download size={18} /></button>
                              <button type="button" onClick={() => { setDeletedFileIds(prev => [...prev, file.fileId]); setExistingFiles(prev => prev.filter(f => f.fileId !== file.fileId)); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        ))}
                        {selectedFiles.filter(f => !isImageFile(f.name)).map((file, idx) => (
                          <div key={`new-file-${idx}`} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-primary/10 dark:border-slate-700 rounded-2xl hover:shadow-md transition-all group">
                            <div className="w-10 h-10 flex-shrink-0 bg-primary/5 text-primary rounded-xl flex items-center justify-center"><File size={20} /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                              <p className="text-[10px] text-primary/60 font-bold uppercase">New Upload</p>
                            </div>
                            <button type="button" onClick={() => setSelectedFiles(prev => prev.filter(f => f !== file))} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-10 flex items-center justify-end gap-4 border-t border-slate-50 dark:border-slate-800">
                  <button type="button" onClick={handleCancelClick} className="px-8 py-4 rounded-2xl text-slate-500 font-black hover:bg-slate-100 transition-all uppercase tracking-widest text-xs">취소</button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="px-10 py-4 rounded-2xl bg-primary text-white font-black hover:bg-blue-600 shadow-xl shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest text-xs">{isSubmitting ? '처리 중...' : editingBoardId ? '수정 완료' : '게시하기'}</button>
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-3 space-y-8">
            <div className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sticky top-8">
              <div className="flex items-center gap-2 mb-8">
                <Info className="text-primary" size={20} />
                <h4 className="text-xl font-black dark:text-white">작성 가이드</h4>
              </div>
              <div className="space-y-8">
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-500"><Zap size={18} /></div>
                    <p className="text-sm font-black dark:text-slate-200">분류 선택</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed ml-11 font-bold">질문인지 팁인지 <strong className="text-primary">카테고리</strong>를 먼저 선택해 주세요. 정보 공유가 더 원활해집니다.</p>
                </div>
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-500"><Save size={18} /></div>
                    <p className="text-sm font-black dark:text-slate-200">자동 저장</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed ml-11 font-bold">작성 중인 내용은 안전하게 보호됩니다. 안심하고 작성해 보세요.</p>
                </div>
              </div>
              <div className="mt-12 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <ShieldCheck size={14} /><span className="text-[10px] font-black uppercase tracking-widest">운영 원칙</span>
                </div>
                <p className="text-[11px] text-slate-400 font-bold leading-relaxed">커뮤니티의 질을 높이기 위해 비방이나 광고성 글은 제한될 수 있습니다.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <ConfirmModal isOpen={isRestoreModalOpen} onClose={handleDiscard} onConfirm={handleRestore} title="작성 중인 글 복구" message="이전에 작성하던 내용이 발견되었습니다. 불러와서 계속 작성하시겠습니까?" type="info" />
      <ConfirmModal 
        isOpen={isBackConfirmOpen} 
        onClose={() => setIsBackConfirmOpen(false)} 
        onConfirm={handleConfirmBack} 
        title="페이지 나가기" 
        message={"작성 중인 내용이 저장되지 않을 수 있습니다.\n정말로 페이지를 나가시겠습니까?"} 
        type="warning" 
        confirmText="나가기"
        cancelText="계속 작성"
      />
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
