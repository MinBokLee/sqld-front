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

import { useUser } from '../contexts/UserContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { useAlert } from '../contexts/AlertContext';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Megaphone, BookOpen, Smile, Save, X, CloudUpload, 
  Info, ShieldCheck, Zap, ChevronsRight, MessageCircle, Lightbulb, HelpCircle, Hash
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
      fetch(`/api/board/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        body: data,
      })
      .then(res => res.json())
      .then(result => {
        const imageUrl = result.url || result.result?.data?.[0];
        if (imageUrl) {
          const fileName = imageUrl.split(/[\\/]/).pop();
          resolve({ default: `/uploads/${fileName}` });
        } else {
          reject('이미지 업로드 실패');
        }
      })
      .catch(() => reject('네트워크 오류'));
    }));
  }
  abort() {}
}

export default function WritePostPage() {
  const { user, clearUser, updateUser } = useUser();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 복구 모달 상태
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [tempData, setTempData] = useState<any>(null);

  // 로컬 스토리지 키
  const STORAGE_KEY = 'sqld_temp_post';

  useEffect(() => {
    if (editingBoardId) {
       fetch(`/api/board/list/${editingBoardId}`)
       .then(res => res.json())
       .then(data => {
         const post = data.result?.data;
         if (post) {
           setTitle(post.title || '');
           setBoardType(post.boardType || 'S');
           setCategory(post.category || 'question');
           setEditorData(post.content || '');
           setTag(post.tagName || '');
         }
       });
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.title || parsed.content) {
            setTempData(parsed);
            setIsRestoreModalOpen(true);
          }
        } catch (e) {
          console.error('Failed to parse temp data');
        }
      }
    }
  }, [editingBoardId]);

  // 메타 정보 자동 저장
  useEffect(() => {
    if (editingBoardId) return; 
    
    const timer = setTimeout(() => {
      if (title || tag || boardType !== initialType) {
        const current = localStorage.getItem(STORAGE_KEY);
        const base = current ? JSON.parse(current) : {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...base,
          title,
          boardType,
          category,
          tag,
          updatedAt: new Date().toISOString()
        }));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, boardType, category, tag, editingBoardId, initialType]);

  const handleRestore = () => {
    if (tempData) {
      setTitle(tempData.title || '');
      setBoardType(tempData.boardType || 'S');
      setCategory(tempData.category || 'question');
      setEditorData(tempData.content || '');
      setTag(tempData.tag || '');
      showAlert({ type: 'success', message: "작성 중이던 내용을 복구했습니다. ✨" });
    }
    setIsRestoreModalOpen(false);
  };

  const handleDiscard = () => {
    localStorage.removeItem(STORAGE_KEY);
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
    const res = await fetch(`/api/board/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user?.accessToken}` },
      body: data,
    });
    const result = await res.json();
    const url = result.url || result.result?.data?.[0];
    const fileName = url.split(/[\\/]/).pop();
    return `/uploads/${fileName}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !editorData.trim()) {
      showAlert({ type: 'warning', message: "입력되지 않은 내용이 있습니다. ⚠️ 제목과 내용을 모두 작성해 주세요." });
      return;
    }
    setIsSubmitting(true);

    try {
      let finalContent = editorData;
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(file => uploadSingleFile(file));
        const uploadedUrls = await Promise.all(uploadPromises);
        const imagesHtml = uploadedUrls.map(url => `<figure class="image"><img src="${url}"></figure>`).join('');
        finalContent += `<hr><p><strong>[첨부 이미지]</strong></p>${imagesHtml}`;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', finalContent);
      formData.append('boardType', boardType);
      formData.append('category', boardType === 'S' ? category : ''); 
      formData.append('tagName', tag);
      formData.append('memberId', user?.memberId || '');

      if (selectedFiles && selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
      }
      const url = editingBoardId ? `/api/board/list/${editingBoardId}` : `/api/board/list/write`;
      const response = await fetch(url, {
        method: editingBoardId ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${user?.accessToken}` },
        body: formData,
      });

      if (response.ok) {
        localStorage.removeItem(STORAGE_KEY);
        if (boardType === 'G' && !editingBoardId) {
          updateUser({ userStatus: 'Y' });
        }
        showAlert({ type: 'success', message: "처리가 완료되었습니다. ✅ 입력하신 내용이 안전하게 등록되었습니다." });
        const listUrl = `/practice-exams?type=${boardType}${boardType === 'S' ? `&category=${category}` : ''}`;
        if (editingBoardId) {
          const detailUrl = `/exam/${editingBoardId}?type=${boardType}`;
          navigate(listUrl, { replace: true });
          setTimeout(() => navigate(detailUrl), 0);
        } else {
          navigate(listUrl, { replace: true });
        }
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      showAlert({ type: 'error', message: "저장 중에 문제가 발생했어요. ⏳ 잠시 후 다시 시도해 주시겠어요?" });
    } finally {
      setIsSubmitting(false);
    }
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
      'heading', '|', 
      'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
      'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
      'alignment', 'highlight', 'horizontalLine', '|',
      'blockQuote', 'codeBlock', 'insertTable', 'uploadImage', 'mediaEmbed', '|', 
      'undo', 'redo'
    ],
    autosave: {
      waitingTime: 1000,
      save(editor) {
        if (editingBoardId) return Promise.resolve();
        const data = editor.getData();
        const current = localStorage.getItem(STORAGE_KEY);
        const base = current ? JSON.parse(current) : {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...base,
          content: data,
          updatedAt: new Date().toISOString()
        }));
        return Promise.resolve();
      }
    },
    image: {
      toolbar: ['imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|', 'toggleImageCaption', 'imageTextAlternative']
    },
    table: {
      contentToolbar: [
        'tableColumn', 'tableRow', 'mergeTableCells', 
        '|', 'tableProperties', 'tableCellProperties'
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
        { name: 'div', attributes: true, classes: true, styles: true },
        { name: 'span', attributes: true, classes: true, styles: true }
      ]
    },
    placeholder: '내용을 입력하세요...',
    licenseKey: 'GPL',
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
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  {editingBoardId ? '게시글 수정하기' : '새로운 게시글 작성'}
                </h2>
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
                        <input 
                          className="peer sr-only" 
                          name="boardType" 
                          type="radio" 
                          checked={boardType === cat.id} 
                          onChange={() => {
                            setBoardType(cat.id);
                            if (cat.id !== 'S') setTag(''); // 'S'가 아니면 태그 초기화
                          }} 
                        />
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
                  <input 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none text-xl font-black focus:ring-2 focus:ring-primary/20 transition-all dark:text-white" 
                    placeholder="제목을 입력하세요" 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                  />
                </div>

                {/* 해시태그 입력창 - SQLD-학습(S) 게시판에서만 노출 */}
                {boardType === 'S' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500 delay-100">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Hash size={14} className="text-primary" /> 해시태그 (쉼표로 구분)
                    </label>
                    <div className="relative group">
                      <input 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl outline-none text-sm font-bold focus:border-primary/20 focus:bg-white dark:focus:bg-slate-700 transition-all dark:text-white" 
                        placeholder="예: SQLD, 서브쿼리, JOIN (엔터나 쉼표로 구분 가능)" 
                        type="text" 
                        value={tag} 
                        onChange={(e) => setTag(e.target.value)} 
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                        {tag.split(',').filter(t => t.trim()).slice(0, 3).map((t, i) => (
                          <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-md">#{t.trim()}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    내용 (SQL 코드는 <span className="text-primary font-black underline">" {`</>`} (코드 블록)</span> 버튼을 사용하세요)
                  </label>
                  <div className="ck-editor-container border-none dark:text-slate-900">
                    <style dangerouslySetInnerHTML={{ __html: `
                      .ck-editor__editable { 
                        min-height: 500px !important; 
                        border-radius: 0 0 1.5rem 1.5rem !important; 
                        padding: 1.5rem 2rem !important; 
                        border: none !important; 
                        background: #f8fafc !important; 
                      }
                      .ck-toolbar { border: none !important; background: #f1f5f9 !important; border-radius: 1.5rem 1.5rem 0 0 !important; padding: 0.5rem 1rem !important; }
                      
                      .ck-content blockquote {
                        background: #f1f5f9 !important;
                        color: #475569 !important;
                        padding: 1.2rem 1.5rem !important;
                        border-radius: 1rem !important;
                        border-left: 6px solid #cbd5e1 !important;
                        margin: 1.5rem 0 !important;
                        font-style: italic !important;
                        height: auto !important;
                        display: block !important;
                      }
                      .dark .ck-content blockquote {
                        background: #334155 !important;
                        color: #e2e8f0 !important;
                        border-left-color: #475569 !important;
                      }

                      /* 고가독성 코드 블록 테마 */
                      .ck-content pre {
                        background: #282c34 !important; /* 깊은 밤색 */
                        color: #abb2bf !important;    /* 부드러운 흰색 */
                        font-family: 'Fira Code', 'JetBrains Mono', monospace !important;
                        padding: 1.5rem !important;
                        border-radius: 1rem !important;
                        border-left: 4px solid #61afef !important; /* 하늘색 포인트 */
                        margin: 1.5rem 0 !important;
                        box-shadow: inset 0 2px 10px rgba(0,0,0,0.3) !important;
                        height: auto !important;
                        display: block !important;
                        position: relative !important;
                      }
                      .ck-content pre::before {
                        content: 'SQL CODE' !important;
                        display: block !important;
                        font-size: 10px !important;
                        font-weight: 900 !important;
                        color: #5c6370 !important;
                        margin-bottom: 0.8rem !important;
                        letter-spacing: 0.1em !important;
                      }
                      
                      .ck-content pre code {
                        background: transparent !important;
                        color: inherit !important;
                        padding: 0 !important;
                        border-radius: 0 !important;
                        font-size: inherit !important;
                      }

                      .ck-content :not(pre) > code {
                        background-color: #e2e8f0 !important;
                        color: #e11d48 !important;
                        padding: 0.2rem 0.4rem !important;
                        border-radius: 0.4rem !important;
                        font-size: 0.9em !important;
                      }
                      .dark .ck-content :not(pre) > code {
                        background-color: #1e293b !important;
                        color: #fb7185 !important;
                      }

                      .ck-content .image img { 
                        max-width: 60% !important; 
                        max-height: 450px !important;
                        margin: 2rem auto !important; 
                        display: block !important;
                        border-radius: 1rem !important;
                        box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1) !important;
                      }

                      .marker-yellow { background-color: #fef08a !important; color: #854d0e !important; }
                      .marker-green { background-color: #bbf7d0 !important; color: #166534 !important; }
                      .marker-pink { background-color: #fbcfe8 !important; color: #9d174d !important; }
                      .marker-blue { background-color: #bfdbfe !important; color: #1e40af !important; }
                    `}} />
                    <CKEditor
                      editor={ClassicEditor}
                      config={editorConfig}
                      data={editorData}
                      onReady={(editor) => {
                        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => new MyUploadAdapter(loader, user?.accessToken || '');

                        editor.keystrokes.set('Tab', (data, stop) => {
                          const selection = editor.model.document.selection;
                          const positionParent = selection.getFirstPosition()?.parent;
                          if (positionParent && (positionParent.name === 'tableCell' || positionParent.name === 'table')) return; 
                          editor.execute('input', { text: '    ' });
                          stop();
                        }, { priority: 'high' });

                        editor.keystrokes.set('shift+Tab', (data, stop) => {
                          editor.execute('outdent');
                          stop();
                        }, { priority: 'high' });

                        editor.keystrokes.set('Enter', (data, stop) => {
                          const selection = editor.model.document.selection;
                          const positionParent = selection.getFirstPosition()?.parent;
                          if (positionParent && positionParent.name === 'codeBlock') {
                            editor.execute('input', { text: '\n' });
                            stop(); 
                          }
                        }, { priority: 'high' });

                        editor.keystrokes.set('ArrowDown', (data, stop) => {
                          const selection = editor.model.document.selection;
                          const position = selection.getFirstPosition();
                          const positionParent = position?.parent;

                          if (positionParent && positionParent.name === 'codeBlock') {
                            const isAtEnd = position.isAtEnd;
                            if (isAtEnd && !positionParent.nextSibling) {
                              editor.model.change(writer => {
                                const paragraph = writer.createElement('paragraph');
                                writer.insert(paragraph, writer.createPositionAfter(positionParent));
                                writer.setSelection(paragraph, 'on');
                              });
                              stop();
                            }
                          }
                        }, { priority: 'high' });
                      }}
                      onChange={(event, editor) => setEditorData(editor.getData())}
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
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-4">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="group relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-white shadow-md">
                          <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                          <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFiles(prev => prev.filter((_, i) => i !== index)); }} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><X size={20} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-10 flex items-center justify-end gap-4 border-t border-slate-50 dark:border-slate-800">
                  <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 rounded-2xl text-slate-500 font-black hover:bg-slate-100 transition-all uppercase tracking-widest text-xs">취소</button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="px-10 py-4 rounded-2xl bg-primary text-white font-black hover:bg-blue-600 shadow-xl shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest text-xs">
                    {isSubmitting ? '처리 중...' : editingBoardId ? '수정 완료' : '게시하기'}
                  </button>
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
                  <p className="text-xs text-slate-500 leading-relaxed ml-11">
                    질문인지 팁인지 <strong>카테고리</strong>를 먼저 선택해 주세요. 정보 공유가 더 원활해집니다.
                  </p>
                </div>

                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-500"><Save size={18} /></div>
                    <p className="text-sm font-black dark:text-slate-200">자동 저장 중</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed ml-11">
                    작성 중인 내용은 브라우저에 안전하게 보호됩니다. 안심하고 작성해 보세요.
                  </p>
                </div>
              </div>

              <div className="mt-12 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">운영 원칙</span>
                </div>
                <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                  커뮤니티의 질을 높이기 위해 비방이나 광고성 글은 제한될 수 있습니다.
                </p>
              </div>
            </div>
          </aside>

        </div>
      </main>

      {/* 임시 저장 데이터 복구 모달 */}
      <ConfirmModal 
        isOpen={isRestoreModalOpen}
        onClose={handleDiscard}
        onConfirm={handleRestore}
        title="작성 중인 글 복구"
        message={`이전에 작성하던 내용이 발견되었습니다.\n(${tempData?.updatedAt ? new Date(tempData.updatedAt).toLocaleString() : ''})\n불러와서 계속 작성하시겠습니까?`}
        type="info"
      />
    </div>
  );
}
