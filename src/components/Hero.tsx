import React from 'react';
import { Link } from 'react-router-dom';

interface HeroProps {
  getText: (key: string) => string;
  onOpenSchedule: () => void;
}

// 2026 SQLD Verified Official Schedule
const EXAM_SCHEDULE = [
  { id: 60, examDate: '2026-03-07' }, // Saturday
  { id: 61, examDate: '2026-05-31' }, // Sunday
  { id: 62, examDate: '2026-08-22' }, // Saturday
  { id: 63, examDate: '2026-11-14' }, // Saturday
];

export default function Hero({ getText, onOpenSchedule }: HeroProps) {
  const getNextExam = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = EXAM_SCHEDULE.find(item => new Date(item.examDate) >= today);
    if (!next) return { id: '?', dDay: '-', date: 'TBA' };

    const examDate = new Date(next.examDate);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      id: next.id,
      dDay: diffDays === 0 ? 'Day' : `-${diffDays}`,
      date: examDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) + (examDate.getDay() === 0 ? ' (일)' : ' (토)')
    };
  };

  const nextExam = getNextExam();

  return (
    <section className="mb-10 px-4 py-12 rounded-3xl bg-gradient-to-br from-primary via-blue-500 to-blue-400 text-white shadow-2xl relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shine-sweep {
          0% { left: -100%; opacity: 0; }
          20% { opacity: 0.6; }
          40% { left: 100%; opacity: 0; }
          100% { left: 100%; opacity: 0; }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-shine { position: absolute; top: 0; width: 60%; height: 100%; background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent); transform: skewX(-25deg); animation: shine-sweep 7s infinite; }
      `}} />

      <div className="absolute top-[-10%] -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-5%] w-80 h-80 bg-blue-300/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 p-4 md:p-6">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
            {getText('hero.title')}
          </h1>
          <p className="text-blue-50 text-base md:text-lg mb-8 opacity-95 font-medium leading-relaxed">
            {getText('hero.subtitle_1')}<br className="hidden md:block" />
            {getText('hero.subtitle_2')}
          </p>
          <div className="flex flex-wrap justify-center lg:justify-start gap-3">
            <Link to="/practice-exams?type=S">
              <button className="bg-white text-primary px-6 py-3 rounded-xl font-black text-sm hover:bg-blue-50 transition-all shadow-lg hover:-translate-y-1 active:scale-95">
                {getText('hero.start_learning')}
              </button>
            </Link>
            <button 
              onClick={onOpenSchedule}
              className="bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-white/20 transition-all hover:-translate-y-1 active:scale-95"
            >
              {getText('hero.exam_schedule')}
            </button>
          </div>
        </div>

        <div className="relative animate-float shrink-0">
          <div className="absolute -inset-3 bg-white/15 blur-2xl rounded-full opacity-40 transition-opacity" />
          
          <button 
            onClick={onOpenSchedule}
            className="relative flex flex-col items-center justify-center p-6 md:p-8 bg-white/15 backdrop-blur-xl rounded-[2rem] border border-white/30 shadow-[0_15px_40px_rgba(0,0,0,0.15)] min-w-[180px] md:min-w-[220px] hover:bg-white/25 transition-all cursor-pointer group active:scale-95 overflow-hidden"
          >
            <div className="animate-shine" />

            <div className="mb-3 px-3 py-1 bg-white/20 rounded-full border border-white/10">
              <span className="text-white text-[10px] md:text-xs font-black tracking-widest uppercase">
                제 {nextExam.id}회 {getText('hero.next_exam')}
              </span>
            </div>

            <span className="text-5xl md:text-6xl font-black text-white drop-shadow-xl tracking-tighter">
              D{nextExam.dDay}
            </span>

            <div className="mt-4 flex flex-col items-center gap-0.5">
              <span className="text-white text-xs md:text-sm font-black opacity-90">
                {nextExam.date}
              </span>
              <span className="text-blue-100 text-[10px] font-bold uppercase tracking-wider opacity-70">
                OFFICIAL DATE
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
