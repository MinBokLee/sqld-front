import React from 'react';
import { Info, Zap, Save, ShieldCheck, Code } from 'lucide-react';

/**
 * 게시글 작성 페이지 우측의 작성 가이드 사이드바 컴포넌트입니다.
 */
const WritingGuideAside: React.FC = () => {
  return (
    <aside className="lg:col-span-3 space-y-8">
      <div className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sticky top-8">
        <div className="flex items-center gap-2 mb-8">
          <span className="p-1.5 bg-primary/10 rounded-lg text-primary">
            <Info size={20} />
          </span>
          <h4 className="text-xl font-black dark:text-white">작성 가이드</h4>
        </div>
        <div className="space-y-8">
          <div className="group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-500">
                <Zap size={18} />
              </div>
              <p className="text-sm font-black dark:text-slate-200">분류 선택</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed ml-11 font-bold">
              질문인지 팁인지 <strong className="text-primary">카테고리</strong>를 먼저 선택해 주세요. 정보 공유가 더 원활해집니다.
            </p>
          </div>
          <div className="group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-500">
                <Code size={18} />
              </div>
              <p className="text-sm font-black dark:text-slate-200">코드블럭 사용</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed ml-11 font-bold">
              코드블럭은 <strong className="text-primary">빈 줄에서 엔터를 두 번</strong> 치면 빠져나올 수 있습니다.
            </p>
          </div>
          <div className="group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-500">
                <Save size={18} />
              </div>
              <p className="text-sm font-black dark:text-slate-200">자동 저장</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed ml-11 font-bold">
              작성 중인 내용은 안전하게 보호됩니다. 안심하고 작성해 보세요.
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
  );
};

export default WritingGuideAside;
