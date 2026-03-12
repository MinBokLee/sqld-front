import { type LucideIcon, Plus, Eye, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../utils/dateUtils';
import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

// const API_BASE_URL = "http://localhost:8881";

export interface BoardItem {
  title: string;
  date?: string; 
  createAt?: string | Date; 
  viewCount?: number; 
  likeCount?: number; 
  id?: string; 
  author?: string; 
  authorImage?: string; // Author's profile image
  boardType?: string; 
  category?: string; 
}

interface BoardProps {
  title: string;
  icon: LucideIcon;
  items: BoardItem[];
  boardType: 'N' | 'S' | 'G';
  isTable?: boolean;
}

export default function Board({ title, icon: Icon, items, boardType, isTable = false }: BoardProps) {
  const boardUrl = `/practice-exams?type=${boardType}`;
  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

  const getCategoryStyle = (category?: string) => {
    switch (category) {
      case 'question': return { dot: 'bg-amber-400', text: 'text-amber-600 dark:text-amber-400/80', label: getText('board.category.question') };
      case 'tip': return { dot: 'bg-emerald-400', text: 'text-emerald-600 dark:text-emerald-400/80', label: getText('board.category.tip') };
      case 'faq': return { dot: 'bg-blue-400', text: 'text-blue-600 dark:text-blue-400/80', label: getText('board.category.faq') };
      default: return null;
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-[#cfdbe7] dark:border-slate-800 shadow-sm overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e7edf3] dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
        <Link to={boardUrl} className="flex items-center gap-2 group">
          <Icon className="text-primary w-6 h-6" />
          <h3 className="text-lg font-bold text-[#0d141b] dark:text-white group-hover:text-primary transition-colors">{title}</h3>
        </Link>
        <Link to={boardUrl} className="text-primary hover:bg-primary/10 p-1 rounded transition-colors">
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {isTable && items.length > 0 && (
        <div className="flex items-center px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-[#e7edf3] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <span className="w-10 shrink-0 text-center">No</span>
          <span className="flex-1 ml-4">게시글 제목</span>
          <span className="w-24 shrink-0 text-center">작성자</span>
          <span className="w-24 shrink-0 text-center">날짜</span>
          <span className="w-16 shrink-0 text-center">조회수</span>
        </div>
      )}

      <div className="flex flex-col divide-y divide-[#e7edf3] dark:divide-slate-800 flex-1">
        {items.length > 0 ? items.map((item, index) => {
          const categoryStyle = getCategoryStyle(item.category);
          
          return (
            <Link
              key={index}
              to={`/exam/${item.id}?type=${boardType}`}
              className="flex flex-col px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              {isTable ? (
                <div className="flex items-center w-full gap-2">
                  <span className="w-10 shrink-0 text-[11px] font-mono text-slate-400 text-center">{items.length - index}</span>
                  <div className="flex-1 ml-4 min-w-0">
                    <p className="text-sm font-bold text-[#0d141b] dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 md:hidden">
                      {item.likeCount !== undefined && item.likeCount > 0 && (
                        <span className="flex items-center text-[9px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/20 px-1 rounded">
                          <Heart className="size-2 mr-0.5 fill-rose-500" /> {item.likeCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="w-24 shrink-0 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                    {item.author}
                  </span>
                  <span className="w-24 shrink-0 text-center text-[11px] font-bold text-slate-400">
                    {item.createAt ? (typeof item.createAt === 'string' ? item.createAt.split('T')[0] : item.createAt.toLocaleDateString()) : item.date}
                  </span>
                  <span className="w-16 shrink-0 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      <Eye size={12} /> {item.viewCount}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-slate-400 mt-1 w-4 flex-shrink-0">{items.length - index}</span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {categoryStyle && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot}`} />
                          <span className={`text-[9px] font-black uppercase tracking-tight ${categoryStyle.text}`}>
                            {categoryStyle.label}
                          </span>
                          <span className="text-slate-200 dark:text-slate-700 text-[10px]">|</span>
                        </div>
                      )}
                      <span className="text-sm font-medium text-[#0d141b] dark:text-slate-200 group-hover:text-primary truncate">
                        {item.title}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-[#4c739a] dark:text-slate-400">
                        <div className="size-4 rounded-full overflow-hidden bg-primary/5 dark:bg-primary/10 flex items-center justify-center border border-primary/5 shadow-sm">
                          {item.authorImage ? (
                            <img src={item.authorImage.startsWith('http') ? item.authorImage : item.authorImage} alt="P" className="w-full h-full object-cover" />
                          ) : (

                            <span className="text-[8px] font-black text-primary uppercase">{item.author?.[0] || 'U'}</span>
                          )}
                        </div>
                        <span className="font-bold">{item.author}</span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-[10px] opacity-80">{item.createAt ? formatRelativeTime(item.createAt) : item.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.likeCount !== undefined && (
                          <span className="flex items-center text-[10px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded-md">
                            <Heart className="size-3 mr-1 fill-rose-500" /> {item.likeCount}
                          </span>
                        )}
                        {item.viewCount !== undefined && (
                          <span className="flex items-center text-[10px] text-slate-400 font-bold bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                            <Eye className="size-3 mr-1 opacity-60" /> {item.viewCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Link>
          );
        }) : (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            게시글이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
