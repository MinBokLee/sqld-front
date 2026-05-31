import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Heart, Eye, Hash, Info } from 'lucide-react';
import { formatRelativeTime } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * [인터페이스] 인기 게시글 데이터 구조
 */
export interface PopularPost {
  id: number;
  title: string;
  date: string;
  views: number;
  likeCount: number;
}

/**
 * [인터페이스] PostSidebar 컴포넌트 Props 정의
 */
interface PostSidebarProps {
  popularPosts: PopularPost[]; // 인기 게시글 목록
  trendingTags: string[];      // 실시간 인기 태그 목록
}

/**
 * [컴포넌트] 우측 사이드바 (인기글 및 태그)
 * 
 * [수정 사항]
 * 1. 실시간 급상승 태그 클릭 시 항상 'type=S' 게시판으로 이동하도록 고정.
 * 2. 인기 게시글의 하트 아이콘 스타일을 fill-rose-500으로 복구.
 * 3. 실시간 급상승 태그 안내 툴팁 아이콘 및 고품질 디자인 적용.
 */
const PostSidebar = memo(({ popularPosts, trendingTags }: PostSidebarProps) => {
  return (
    <aside className="lg:col-span-3 space-y-8">
      <div className="lg:sticky lg:top-8 space-y-8">
        
        {/* [섹션 1] 인기 게시글 목록 */}
        <div className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="text-primary" size={20} />
            <h4 className="text-xl font-black dark:text-white tracking-tight">인기 게시글</h4>
          </div>
          <div className="space-y-6">
            {popularPosts.length > 0 ? (
              popularPosts.map((post) => (
                <Link 
                  key={post.id} 
                  to={`/exam/${post.id}?boardCode=S`} 
                  className="block group border-b border-slate-50 dark:border-slate-800 pb-5 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-black text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors line-clamp-2 mb-3 leading-relaxed">
                    {post.title}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>{formatRelativeTime(post.date)}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20 text-rose-500 px-2 py-1 rounded-lg">
                        {/* 깃 디자인 복구: 색이 채워진 하트 */}
                        <Heart size={10} className="fill-rose-500" /> {post.likeCount}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        <Eye size={10} /> {post.views}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 font-bold">
                인기 게시글이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* [섹션 2] 실시간 급상승 태그 */}
        <div className="bg-white dark:bg-[#1a222c] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
          {/* 장식 디자인 요소 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Hash className="text-primary" size={18} /> 실시간 급상승 태그
            </h3>
            <div className="relative group/tag-info">
              <Info size={14} className="text-slate-300 hover:text-primary transition-colors cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 text-white text-[11px] font-black rounded-xl opacity-0 group-hover/tag-info:opacity-100 transition-all pointer-events-none shadow-2xl z-50 scale-95 group-hover/tag-info:scale-100 origin-bottom-right leading-relaxed">
                가장 최근에 작성된 30개의 게시글을 실시간으로 분석하여, 지금 커뮤니티에서 가장 주목받는 키워드를 보여줍니다.
                <div className="absolute top-full right-1 border-[5px] border-transparent border-t-slate-900" />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2.5 relative z-10">
            {trendingTags.length > 0 ? (
              trendingTags.map((tag, i) => (
                <Link 
                  key={i} 
                  to={`/practice-exams?boardCode=S&tagName=${encodeURIComponent(tag)}`} 
                  className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 text-[11px] font-black text-slate-500 dark:text-slate-400 hover:bg-primary hover:text-white transition-all border border-slate-100 dark:border-white/5 active:scale-95"
                >
                  #{tag}
                </Link>
              ))
            ) : (
              <p className="text-[11px] text-slate-500 py-6 text-center w-full font-bold">작성된 태그가 없습니다.</p>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
});

export default PostSidebar;
