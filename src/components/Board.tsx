import { type LucideIcon, Plus } from 'lucide-react';

interface BoardItem {
  title: string;
  date: string;
}

interface BoardProps {
  title: string;
  icon: LucideIcon;
  items: BoardItem[];
}

export default function Board({ title, icon: Icon, items }: BoardProps) {
  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-[#cfdbe7] dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e7edf3] dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Icon className="text-primary w-6 h-6" />
          <h3 className="text-lg font-bold text-[#0d141b] dark:text-white">{title}</h3>
        </div>
        <a href="#" className="text-primary hover:bg-primary/10 p-1 rounded transition-colors">
          <Plus className="w-5 h-5" />
        </a>
      </div>
      <div className="flex flex-col divide-y divide-[#e7edf3] dark:divide-slate-800">
        {items.map((item, index) => (
          <a
            key={index}
            href="#"
            className="flex flex-col px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <span className="text-sm font-medium text-[#0d141b] dark:text-slate-200 group-hover:text-primary truncate">
              {item.title}
            </span>
            <span className="text-xs text-[#4c739a] mt-1">{item.date}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
