import React from 'react';
import { X, Calendar, CheckCircle2, Clock, AlertCircle, Info } from 'lucide-react';

interface ExamScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 2026 SQLD Official Data provided by User
const EXAM_SCHEDULE = [
  { 
    id: 60, 
    reg: '2.2 ~ 2.6', 
    ticket: '2.20', 
    exam: '3.7 (토)', 
    preScore: '3.20 ~ 3.24', 
    pass: '3.27',
    examDateObj: new Date('2026-03-07'),
    regStartObj: new Date('2026-02-02'),
    regEndObj: new Date('2026-02-06')
  },
  { 
    id: 61, 
    reg: '4.27 ~ 5.1', 
    ticket: '5.15', 
    exam: '5.31 (일)', 
    preScore: '6.12 ~ 6.16', 
    pass: '6.19',
    examDateObj: new Date('2026-05-31'),
    regStartObj: new Date('2026-04-27'),
    regEndObj: new Date('2026-05-01')
  },
  { 
    id: 62, 
    reg: '7.20 ~ 7.24', 
    ticket: '8.7', 
    exam: '8.22 (토)', 
    preScore: '9.4 ~ 9.8', 
    pass: '9.11',
    examDateObj: new Date('2026-08-22'),
    regStartObj: new Date('2026-07-20'),
    regEndObj: new Date('2026-07-24')
  },
  { 
    id: 63, 
    reg: '10.12 ~ 10.16', 
    ticket: '10.30', 
    exam: '11.14 (토)', 
    preScore: '11.27 ~ 12.1', 
    pass: '12.4',
    examDateObj: new Date('2026-11-14'),
    regStartObj: new Date('2026-10-12'),
    regEndObj: new Date('2026-10-16')
  },
];

export default function ExamScheduleModal({ isOpen, onClose }: ExamScheduleModalProps) {
  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getStatus = (regStart: Date, regEnd: Date, examDate: Date) => {
    if (today > examDate) return { label: '종료', color: 'text-slate-400 bg-slate-100' };
    if (today.getTime() === examDate.getTime()) return { label: '시험일', color: 'text-red-600 bg-red-50 animate-pulse' };
    if (today >= regStart && today <= regEnd) return { label: '접수 중', color: 'text-blue-600 bg-blue-50' };
    if (today < regStart) return { label: '접수 예정', color: 'text-emerald-600 bg-emerald-50' };
    return { label: '접수 종료', color: 'text-slate-500 bg-slate-100' };
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a222c] w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
              <Calendar size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">2026 SQLD 시험 일정 안내</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-0.5 flex items-center gap-1.5">
                <Info size={14} /> 한국데이터산업진흥원(Kdata) 공식 시행 계획 기준
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all active:scale-95 group">
            <X size={28} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white" />
          </button>
        </div>

        {/* Content - Multi-column Table */}
        <div className="p-8 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                <th className="py-5 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">회차</th>
                <th className="py-5 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">원서접수</th>
                <th className="py-5 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">수험표발급</th>
                <th className="py-5 px-4 text-xs font-black text-primary uppercase tracking-widest text-center bg-primary/5 rounded-t-xl">시험일</th>
                <th className="py-5 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">사전점수공개</th>
                <th className="py-5 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">합격자발표</th>
                <th className="py-5 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {EXAM_SCHEDULE.map((item) => {
                const status = getStatus(item.regStartObj, item.regEndObj, item.examDateObj);
                const isTarget = status.label !== '종료';
                return (
                  <tr key={item.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors ${!isTarget ? 'opacity-50' : ''}`}>
                    <td className="py-6 px-4 font-black text-lg text-slate-700 dark:text-slate-200">제 {item.id}회</td>
                    <td className="py-6 px-4 text-sm font-bold text-slate-600 dark:text-slate-400">{item.reg}</td>
                    <td className="py-6 px-4 text-sm font-bold text-slate-500 dark:text-slate-500 text-center">{item.ticket}</td>
                    <td className="py-6 px-4 text-base font-black text-primary text-center bg-primary/[0.02]">{item.exam}</td>
                    <td className="py-6 px-4 text-sm font-bold text-slate-500 dark:text-slate-500 text-center">{item.preScore}</td>
                    <td className="py-6 px-4 text-sm font-black text-slate-900 dark:text-white text-center">{item.pass}</td>
                    <td className="py-6 px-4 text-center">
                      <span className={`inline-block px-4 py-1.5 rounded-xl text-[11px] font-black uppercase shadow-sm ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Guidelines Box */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-800/30 flex gap-4">
              <AlertCircle className="text-blue-500 shrink-0" size={24} />
              <div>
                <p className="text-sm font-black text-blue-900 dark:text-blue-200 mb-1">유의사항 안내</p>
                <p className="text-xs text-blue-700/80 dark:text-blue-300/80 leading-relaxed font-bold">
                  시험 접수는 마지막 날 18:00에 마감됩니다. <br/>
                  61회 시험은 일요일(5.31)에 시행되니 착오 없으시길 바랍니다.
                </p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 flex gap-4">
              <CheckCircle2 className="text-slate-400 shrink-0" size={24} />
              <div>
                <p className="text-sm font-black text-slate-700 dark:text-slate-300 mb-1">응시 자격 및 접수</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                  SQL 개발자(SQLD)는 별도의 응시 자격 제한이 없습니다. <br/>
                  모든 접수는 데이터자격검정 홈페이지에서 가능합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-8 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">© 2026 SQLD Community Service</p>
          <button 
            onClick={() => window.open('https://www.dataq.or.kr/www/accept/schedule.do', '_blank')}
            className="px-6 py-3 bg-white dark:bg-slate-700 text-primary dark:text-blue-400 text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 border border-slate-100 dark:border-slate-600 active:scale-95"
          >
            DataQ 공식 홈페이지 바로가기 <CheckCircle2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
