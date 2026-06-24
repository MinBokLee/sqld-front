import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams, Link, useBlocker } from 'react-router-dom';
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
import { useUser } from '../contexts/UserContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { useAlert } from '../contexts/AlertContext';
import { useBoard } from '../contexts/BoardContext';
import ConfirmModal from '../components/ConfirmModal';
import api, { type BoardMaster, type CommonCodeDetail } from '../utils/api'; 
import { 
  Megaphone, BookOpen, Smile, X, CloudUpload, 
  ChevronsRight, MessageCircle, Lightbulb, HelpCircle, Hash, Download, ZoomIn, FileText, Trash2, File
} from 'lucide-react';
import ImageLightbox from '../components/ImageLightbox';
import WritingGuideAside from '../components/WritingGuideAside';

/**
 * [커스텀 플러그인] TableColumnWidthEqualizer
 * 표의 모든 열 너비를 균등하게 맞춰주는 기능을 제공합니다.
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
      const storedUserStr = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (!storedUserStr) {
        reject('세션이 만료되었습니다. 다시 로그인 후 이미지를 업로드해 주세요.');
        return;
      }
      const data = new FormData();
      data.append('upload', file);
      api.post(`/api/board/upload`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(res => {
        // 백엔드 통합 규격: res 자체가 이미 data 필드 내용임
        const imageUrl = (res as any)?.url || (res as any)?.[0];
        if (imageUrl) resolve({ default: imageUrl });
        else reject('이미지 업로드 실패');
      })
      .catch((err) => reject(err.message || '이미지 전송 오류'));
    }));
  }
  abort() {}
}

export default function WritePostPage() {
  const { user, updateUser, isLoading: isUserLoading } = useUser();
  const { showAlert, showToast } = useAlert();
  const { boardConfigs, getBoardConfig, getBoardCode, getBoardCategories } = useBoard();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null); 
  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

  const getMappedInitialCode = useCallback(() => {
    const rawCode = searchParams.get('boardCode');
    if (!rawCode) return getBoardCode('G_BRD_LICENSE') || '';
    if (rawCode === 'N') return getBoardCode('G_BRD_NOTICE') || rawCode;
    if (rawCode === 'S') return getBoardCode('G_BRD_LICENSE') || rawCode;
    if (rawCode === 'G') return getBoardCode('G_BRD_GREETING') || rawCode;
    return rawCode;
  }, [searchParams, getBoardCode]);

  const editingBoardId = searchParams.get('boardId');
  const [title, setTitle] = useState('');
  const [boardCode, setBoardCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const boardConfig = getBoardConfig(boardCode);
  const categories = getBoardCategories(boardCode);
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

  useEffect(() => {
    if (categories.length > 0) {
      if (!categoryId || !categories.find(c => c.categoryId === categoryId)) setCategoryId(categories[0].categoryId);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (!boardCode && boardConfigs.length > 0) setBoardCode(getMappedInitialCode());
  }, [boardConfigs, getMappedInitialCode, boardCode]);

  const blocker = useBlocker(useCallback(({ currentLocation, nextLocation }) =>
    !isSuccessfullySubmitted.current && (title.trim() !== '' || editorData.trim() !== '') && currentLocation.pathname !== nextLocation.pathname,
  [title, editorData]));

  useEffect(() => { if (blocker.state === 'blocked') setIsBackConfirmOpen(true); }, [blocker.state]);

  const handleConfirmBack = () => {
    setIsBackConfirmOpen(false);
    if (blocker.state === 'blocked') {
      isSuccessfullySubmitted.current = true;
      const { pathname, search, hash } = blocker.location;
      navigate(pathname + search + hash, { replace: true });
    }
  };

  const fixImagePath = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    let normalized = path;
    if (path.includes('/Users/')) normalized = path.split(/[\\/]/).pop() || '';
    const fileName = normalized.replace(/^.*uploads\/*/, '');
    return `/uploads/${fileName}`;
  };

  const fixContentHtml = (html: string) => {
    if (!html) return '';
    let correctedHtml = html;
    correctedHtml = correctedHtml.replace(/src="https?:\/\/[^/]+\/uploads\/*([^"]+)"/g, 'src="/uploads/$1"');
    correctedHtml = correctedHtml.replace(/src="\/+uploads\/*([^"]+)"/g, 'src="/uploads/$1"');
    correctedHtml = correctedHtml.replace(/\/uploads\/+uploads\/*/g, '/uploads/');
    // 이미지(figure) 태그 사이에 낀 불필요한 빈 문단(<p>&nbsp;</p> 등) 제거하여 가로 정렬 높이 어긋남 방지
    correctedHtml = correctedHtml.replace(/(<\/figure>)\s*(<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>)\s*(<figure)/gi, '$1$3');
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
      editorRef.current.setData(currentHtml.replace(regex, ''));
    }
  };

  const isDataFetched = useRef(false);
  useEffect(() => {
    if (editingBoardId && !isDataFetched.current) {
       api.get(`api/board/list/detail/${editingBoardId}`)
       .then((post: any) => {
         if (post) {
           setTitle(post.title || ''); setBoardCode(post.boardCode || 'S'); setCategoryId(post.categoryId || 'question');
           setEditorData(fixContentHtml(post.content || '')); setTag(post.tagName || '');
           const files = post.fileList || post.boardFileList || post.files || [];
           setExistingFiles(files.map((f: any) => ({ ...f, displayPath: fixImagePath(f.filePath || f.saveName || '') })));
           isDataFetched.current = true;
         }
       }).catch(() => navigate(-1));
    } else if (!editingBoardId && STORAGE_KEY && !isDataFetched.current) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.title || parsed.content) { setTempData(parsed); setIsRestoreModalOpen(true); }
          isDataFetched.current = true;
        } catch (e) { console.error(e); }
      }
    }
  }, [editingBoardId, STORAGE_KEY, navigate]); 

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) { showToast("로그인이 필요한 서비스입니다. ✅", 'warning'); navigate('/'); }
  }, [user, isUserLoading, navigate, showToast]);

  useEffect(() => {
    if (isRestoreModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isRestoreModalOpen]);

  useEffect(() => {
    if (isBackConfirmOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isBackConfirmOpen]);

  const handleRestore = () => {
    if (tempData) {
      setTitle(tempData.title || ''); setBoardCode(tempData.boardCode || 'S'); setCategoryId(tempData.categoryId || 'question');
      setEditorData(tempData.content || ''); setTag(tempData.tag || '');
      if (editorRef.current) editorRef.current.setData(tempData.content || '');
    }
    setIsRestoreModalOpen(false);
  };

  const handleCancelClick = () => {
    navigate(-1);
  };

  const handleDiscard = () => {
    if (STORAGE_KEY) {
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsRestoreModalOpen(false);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = (fileId: number) => {
    setDeletedFileIds(prev => [...prev, fileId]);
    setExistingFiles(prev => prev.filter(f => f.fileId !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let currentEditorContent = editorRef.current ? editorRef.current.getData() : editorData;
    if (!title.trim() || !currentEditorContent.trim()) { showToast("내용을 입력해 주세요. ⚠️", 'warning'); return; }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (editingBoardId) { formData.append('boardId', editingBoardId); if (deletedFileIds.length > 0) deletedFileIds.forEach(id => formData.append('deleteFileIds', String(id))); }
      formData.append('title', title); formData.append('content', currentEditorContent); 
      formData.append('boardCode', boardCode); formData.append('categoryId', categoryId); 
      formData.append('tagName', tag); formData.append('memberId', user?.memberId || '');
      if (selectedFiles.length > 0) selectedFiles.forEach(file => formData.append('files', file));
      
      const url = editingBoardId ? `/api/board/list/${editingBoardId}` : `/api/board/list/write`;
      const res: any = await api({ method: editingBoardId ? 'put' : 'post', url, data: formData, headers: { 'Content-Type': 'multipart/form-data' } });

      isSuccessfullySubmitted.current = true;
      if (STORAGE_KEY) localStorage.removeItem(STORAGE_KEY);
      if (boardCode === getBoardCode('G_BRD_GREETING') && !editingBoardId) updateUser({ userStatus: 'Y' });
      
      const targetId = editingBoardId || res?.boardId;
      if (targetId) navigate(`/exam/${targetId}?boardCode=${encodeURIComponent(boardCode)}`, { replace: true });
      else navigate(`/practice-exams?boardCode=${encodeURIComponent(boardCode)}`, { replace: true });
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const editorConfig: EditorConfig = {
    plugins: [ Essentials, Paragraph, Heading, Bold, Italic, CKLink, List, BlockQuote, Image, ImageUpload, FileRepository, Table, TableToolbar, TableProperties, TableCellProperties, TableColumnResize, Autoformat, AutoImage, ImageInsert, ImageResize, ImageStyle, ImageToolbar, Indent, TextTransformation, Undo, Code, CodeBlock, Alignment, Highlight, HorizontalLine, CloudServices, FontColor, FontBackgroundColor, FontSize, FontFamily, MediaEmbed, HtmlEmbed, GeneralHtmlSupport, Autosave, TableColumnWidthEqualizer ],
    toolbar: [ 'heading', '|', 'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|', 'bold', 'bulletedList', 'numberedList', 'alignment', 'highlight', '|', 'uploadImage', 'insertTable', 'codeBlock', '|', 'undo', 'redo' ],
    image: { toolbar: ['imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|', 'imageTextAlternative'], resizeUnit: '%' },
    table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', '|', 'tableProperties', 'tableCellProperties', '|', 'alignment', 'tableColumnWidthEqualizer'] },
    fontSize: {
      options: [
        '10px',
        '12px',
        '14px',
        'default',
        '18px',
        '20px',
        '24px',
        '30px',
        '36px'
      ],
      supportAllValues: true
    },
    codeBlock: { languages: [{ language: 'sql', label: 'SQL (SQLD)' }, { language: 'javascript', label: 'JavaScript' }, { language: 'python', label: 'Python' }, { language: 'plaintext', label: 'Plain text' }] },
    htmlSupport: { allow: [{ name: /.*/, attributes: true, classes: true, styles: true }] },
    placeholder: '내용을 입력하세요...', licenseKey: 'GPL',
  };

  const handleEditorReady = (editor: any) => {
    editorRef.current = editor;
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => new MyUploadAdapter(loader, user?.accessToken || '');
  };

  const handleFileDownload = async (fileId: number, fileName: string) => {
    try {
      const response = await api.get(`/api/board/download/${fileId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response as any]));
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', fileName);
      document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
    } catch (error) { console.error(error); }
  };

  const isImageFile = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);

  return (
    <div className="bg-slate-50 dark:bg-[#0d141b] min-h-screen font-sans">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8 font-bold"><Link to="/" className="hover:text-primary transition-colors font-medium">{getText('common.home')}</Link><ChevronsRight size={14} /><span className="text-slate-600 dark:text-slate-200 font-bold">{editingBoardId ? '글 수정' : '새 글 작성'}</span></nav>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9 space-y-6">
            <div className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 sm:p-10 border-b border-slate-50 dark:border-slate-800"><h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{editingBoardId ? '게시글 수정하기' : '새로운 게시글 작성'}</h2><p className="text-slate-500 dark:text-slate-400 font-medium">유용한 지식과 경험을 커뮤니티에 공유해 보세요.</p></div>
              <div className="p-6 sm:p-10 space-y-8">
                <div className="space-y-3"><label className="text-xs font-black uppercase tracking-widest text-slate-400">게시판 선택</label><div className="flex flex-wrap p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-fit gap-1">{boardConfigs.filter(config => config.useYn === 'Y').map((config) => (<label key={config.boardCode} className="cursor-pointer"><input className="peer sr-only" name="boardCode" type="radio" checked={boardCode === config.boardCode} onChange={() => { setBoardCode(config.boardCode); setTag(''); }} /><div className="px-6 py-3 rounded-xl text-sm font-black text-slate-500 peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-primary peer-checked:shadow-sm transition-all flex items-center gap-2">{config.groupCode === 'G_BRD_NOTICE' ? <Megaphone size={16} /> : config.groupCode === 'G_BRD_GREETING' ? <Smile size={16} /> : <BookOpen size={16} />}{config.boardName}</div></label>))}</div></div>
                {categories.length > 0 && (<div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"><label className="text-xs font-black uppercase tracking-widest text-slate-400">카테고리 설정</label><div className="flex flex-wrap gap-2">{categories.map((cat) => (<label key={cat.categoryId} className="cursor-pointer"><input className="peer sr-only" name="categoryId" type="radio" checked={categoryId === cat.categoryId} onChange={() => setCategoryId(cat.categoryId)} /><div className="px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all flex items-center gap-2">{cat.categoryName}</div></label>))}</div></div>)}
                <div className="space-y-3"><label className="text-xs font-black uppercase tracking-widest text-slate-400">제목</label><input className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none text-xl font-black focus:ring-2 focus:ring-primary/20 transition-all dark:text-white" placeholder="제목을 입력하세요" type="text" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                {boardConfig?.tagYn === 'Y' && (<div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500 delay-100"><label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Hash size={14} className="text-primary" /> 해시태그 (쉼표로 구분)</label><input className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl outline-none text-sm font-bold focus:border-primary/20 focus:bg-white dark:focus:bg-slate-700 transition-all dark:text-white" placeholder="예: SQLD, 서브쿼리, JOIN" type="text" value={tag} onChange={(e) => setTag(e.target.value)} /></div>)}
                <div className="space-y-3"><label className="text-xs font-black uppercase tracking-widest text-slate-400">내용</label><div className="ck-editor-container border-none dark:text-slate-900"><style dangerouslySetInnerHTML={{ __html: `.ck-editor__editable { min-height: 500px !important; border-radius: 0 0 1.5rem 1.5rem !important; padding: 1.5rem 2rem !important; border: none !important; background: #f8fafc !important; } .ck-toolbar { border: none !important; background: #f1f5f9 !important; border-radius: 1.5rem 1.5rem 0 0 !important; padding: 0.5rem 1rem !important; } .ck-content figure.table { margin: 1.5rem 0 !important; display: table !important; width: auto !important; max-width: 100% !important; } .ck-content figure.table table { border-collapse: collapse !important; border: 1px solid #cbd5e1 !important; table-layout: fixed !important; width: 100% !important; min-width: 50px !important; } .ck-content figure.table td, .ck-content figure.table th { border: 1px solid #cbd5e1 !important; padding: 0.75rem !important; word-break: break-all !important; overflow-wrap: break-word !important; }`}} /><CKEditor editor={ClassicEditor} config={editorConfig} data={editorData} onReady={handleEditorReady} onChange={(event, editor) => setEditorData(editor.getData())} /></div></div>
                {boardConfig?.fileYn === 'Y' && (
                  <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between"><label className="text-xs font-black uppercase tracking-widest text-slate-400">미디어 및 첨부파일</label><span className="text-[10px] font-bold text-slate-400">최대 50MB까지 업로드 가능</span></div>
                    <div className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group ${isDragOver ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50 dark:bg-slate-800/30 dark:border-slate-700 hover:border-primary hover:bg-primary/5'}`} onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files) setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }} onClick={() => fileInputRef.current?.click()}>
                      <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors"><CloudUpload size={32} /></div>
                      <div className="text-center"><p className="text-sm font-black text-slate-700 dark:text-slate-200">파일을 여기에 드래그하거나 클릭하여 업로드</p><p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tighter">PNG, JPG, PDF, ZIP</p></div>
                      <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => { if (e.target.files) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} />
                    </div>

                    {/* 첨부파일 리스트 미리보기 영역 */}
                    {(existingFiles.length > 0 || selectedFiles.length > 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-300">
                        {/* 기존 파일 (수정 시) */}
                        {existingFiles.map((file) => {
                          const isImg = isImageFile(file.originName);
                          return (
                            <div key={file.fileId} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 group transition-all hover:border-primary/20">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="size-10 bg-slate-50 dark:bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-600 transition-all">
                                  {isImg ? (
                                    <img src={file.displayPath} alt="preview" className="w-full h-full object-cover" />
                                  ) : (
                                    <FileText size={18} className="text-slate-400" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{file.originName}</span>
                                  <span className="text-[9px] text-slate-400 font-black uppercase">기존 파일</span>
                                </div>
                              </div>
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveExistingFile(file.fileId); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><X size={16} /></button>
                            </div>
                          );
                        })}
                        {/* 신규 추가 파일 */}
                        {selectedFiles.map((file, idx) => {
                          const isImg = isImageFile(file.name);
                          return (
                            <div key={`new-${idx}`} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-primary/20 group transition-all hover:bg-primary/5">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="size-10 bg-primary/5 dark:bg-primary/10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center border border-primary/10 transition-all">
                                  {isImg ? (
                                    <img src={URL.createObjectURL(file)} alt="new preview" className="w-full h-full object-cover" />
                                  ) : (
                                    <FileText size={18} className="text-primary/40" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{file.name}</span>
                                  <span className="text-[9px] text-primary font-black uppercase tracking-widest">New Upload</span>
                                </div>
                              </div>
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><X size={16} /></button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-10 flex items-center justify-end gap-4 border-t border-slate-50 dark:border-slate-800"><button type="button" onClick={handleCancelClick} className="px-8 py-4 rounded-2xl text-slate-500 font-black hover:bg-slate-100 transition-all uppercase tracking-widest text-xs">{getText('common.cancel')}</button><button onClick={handleSubmit} disabled={isSubmitting} className="px-10 py-4 rounded-2xl bg-primary text-white font-black hover:bg-blue-600 shadow-xl shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest text-xs">{isSubmitting ? '처리 중...' : editingBoardId ? '수정 완료' : '게시하기'}</button></div>
              </div>
            </div>
          </div>
          <WritingGuideAside />
        </div>
      </main>
      <ConfirmModal isOpen={isRestoreModalOpen} onClose={handleDiscard} onConfirm={handleRestore} title="작성 중인 글 복구" message="이전에 작성하던 내용이 발견되었습니다. 불러와서 계속 작성하시겠습니까?" type="info" />
      <ConfirmModal isOpen={isBackConfirmOpen} onClose={() => setIsBackConfirmOpen(false)} onConfirm={handleConfirmBack} title="페이지 나가기" message={"작성 중인 내용이 저장되지 않을 수 있습니다.\n정말로 페이지를 나가시겠습니까?"} type="warning" confirmText="나가기" cancelText="계속 작성" />
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
