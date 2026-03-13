import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, FileText, Cookie, Scale, 
  ChevronRight, ArrowLeft, Info, CheckCircle2,
  UserPlus, Lock, Trash2, BookOpen, AlertTriangle,
  HelpCircle, Eye, MousePointer2, RefreshCcw
} from 'lucide-react';

type TabType = 'terms' | 'privacy' | 'cookie' | 'legal-notice';

export default function LegalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'terms';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['terms', 'privacy', 'cookie', 'legal-notice'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    window.scrollTo(0, 0);
  };

  const tabs = [
    { id: 'terms', label: '서비스 이용약관', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'privacy', label: '개인정보처리방침', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'cookie', label: '쿠키 정책', icon: Cookie, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'legal-notice', label: '공식 고지사항', icon: Scale, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="bg-slate-50 dark:bg-[#0d141b] min-h-screen font-sans">
      <div className="max-w-[1000px] mx-auto px-4 py-12">
        
        {/* Header Section */}
        <div className="mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-bold mb-6">
            <ArrowLeft size={16} /> 홈으로 돌아가기
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-10 bg-primary rounded-full" />
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">운영 정책 센터</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
            SQLD 커뮤니티는 투명한 운영과 사용자의 권리 보호를 최우선으로 생각합니다. 
            우리의 약속과 규칙을 더 쉽고 명확하게 안내해 드립니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Tabs */}
          <aside className="lg:col-span-1 space-y-2 lg:sticky lg:top-28 lg:self-start">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-200 text-left font-bold ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-primary ring-1 ring-slate-200 dark:ring-slate-700' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-2 rounded-xl ${activeTab === tab.id ? tab.bg + ' dark:bg-slate-700' : 'bg-transparent'}`}>
                  <tab.icon size={20} className={activeTab === tab.id ? tab.color : 'text-slate-300'} />
                </div>
                <span className="text-sm">{tab.label}</span>
                {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
              </button>
            ))}
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            <div className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[600px]">
              
              {/* Friendly Summary Section */}
              <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary text-white rounded-lg shadow-lg shadow-primary/20"><Info size={20} /></div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">한 눈에 보는 핵심 요약</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {getSummaryContent(activeTab).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-bold">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Detailed Content Section */}
              <div className="p-8 sm:p-10 space-y-10">
                {getLegalContent(activeTab)}
              </div>

            </div>

            {/* Support Footer */}
            <div className="mt-8 p-8 bg-gradient-to-r from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 rounded-[2rem] border border-primary/10 flex flex-col sm:flex-row items-center gap-6">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm"><HelpCircle className="text-primary" size={32} /></div>
              <div className="text-center sm:text-left">
                <p className="text-lg font-black text-slate-900 dark:text-white mb-1">내용이 이해하기 어려우신가요?</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">언제든지 고객센터로 문의해 주시면 친절하게 설명해 드릴게요.</p>
              </div>
              <button className="sm:ml-auto px-8 py-3.5 bg-primary text-white text-sm font-black rounded-xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">문의하기</button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Card Wrapper Component
const PolicyCard = ({ title, icon: Icon, children, badge }: { title: string, icon: any, children: React.ReactNode, badge?: string }) => (
  <div className="group space-y-4">
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
        <Icon size={20} />
      </div>
      <div className="flex items-center gap-2">
        <h4 className="text-lg font-black text-slate-800 dark:text-white">{title}</h4>
        {badge && <span className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-black rounded-md uppercase tracking-tighter">{badge}</span>}
      </div>
    </div>
    <div className="pl-1 mr-4 border-l-2 border-slate-100 dark:border-slate-800 ml-5 pl-8 py-2">
      <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium space-y-3">
        {children}
      </div>
    </div>
  </div>
);

// Helper functions for content
function getSummaryContent(tab: TabType): string[] {
  switch (tab) {
    case 'terms':
      return [
        "회원님은 커뮤니티 내에서 자유롭게 학습 정보를 공유하고 질문할 수 있습니다.",
        "타인을 비방하거나 광고성 게시물을 올리는 경우 서비스 이용이 제한될 수 있습니다.",
        "회원님이 작성한 소중한 게시물의 저작권은 회원님 본인에게 있습니다."
      ];
    case 'privacy':
      return [
        "회원가입을 위해 이메일과 닉네임만 수집하며, 불필요한 정보는 묻지 않습니다.",
        "수집된 정보는 서비스 제공 목적 이외에 절대 제3자에게 판매하거나 제공하지 않습니다.",
        "회원 탈퇴 시 모든 개인정보는 즉시 파기되어 복구할 수 없습니다."
      ];
    case 'cookie':
      return [
        "쿠키는 회원님의 로그인 상태를 유지하고 사이트 설정을 기억하는 데 사용됩니다.",
        "우리는 사용자의 브라우징 습관을 추적하여 광고를 보여주는 쿠키를 사용하지 않습니다.",
        "브라우저 설정에서 언제든지 쿠키 사용을 거부하거나 삭제할 수 있습니다."
      ];
    case 'legal-notice':
      return [
        "커뮤니티 내의 정보는 참고용이며, 공식적인 시험 결과나 법적 효력을 보장하지 않습니다.",
        "서버 점검이나 불가항력적인 상황에서 서비스가 일시 중단될 수 있습니다.",
        "공식 시험 문제 등 저작권을 침해하는 자료의 게시를 엄격히 금지합니다."
      ];
  }
}

function getLegalContent(tab: TabType) {
  switch (tab) {
    case 'terms':
      return (
        <div className="space-y-12">
          <PolicyCard title="서비스의 목적" icon={FileText} badge="Article 1">
            <p>이 약관은 <strong>SQLD 커뮤니티</strong>가 제공하는 다양한 학습 서비스와 기능을 회원님들이 안전하고 즐겁게 이용할 수 있도록 돕는 규칙입니다.</p>
          </PolicyCard>
          <PolicyCard title="에티켓 및 게시물 관리" icon={BookOpen} badge="Article 2">
            <p>우리는 상호 존중하는 문화를 지향합니다. 아래와 같은 내용은 관리자에 의해 숨김 처리될 수 있어요.</p>
            <ul className="list-disc ml-4 space-y-2">
              <li>타인에 대한 비방이나 명예를 훼손하는 발언</li>
              <li>상업적인 목적의 무단 광고</li>
              <li>공식 시험 기밀 유출 등 저작권 침해 사례</li>
            </ul>
          </PolicyCard>
          <PolicyCard title="콘텐츠의 주인공은 회원님입니다" icon={UserPlus} badge="Article 3">
            <p>회원님이 정성스럽게 작성하신 공부 비법과 질문들의 저작권은 <strong>회원님 본인</strong>에게 있습니다.</p>
            <p>다만, 커뮤니티의 홍보와 서비스 개선을 위해 익명화된 상태로 활용될 수 있음을 알려드려요.</p>
          </PolicyCard>
        </div>
      );
    case 'privacy':
      return (
        <div className="space-y-12">
          <PolicyCard title="수집하는 정보" icon={Lock}>
            <p>우리는 서비스 제공에 꼭 필요한 정보만 최소한으로 요청합니다.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-black text-primary uppercase block mb-1">필수 정보</span>
                <p className="text-slate-700 dark:text-slate-200">이메일, 비밀번호, 닉네임</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-black text-slate-400 uppercase block mb-1">자동 수집</span>
                <p className="text-slate-700 dark:text-slate-200">쿠키, 서비스 이용 기록</p>
              </div>
            </div>
          </PolicyCard>
          <PolicyCard title="정보 이용 및 보관" icon={Eye}>
            <p>수집된 정보는 오직 <strong>회원 식별 및 공지사항 전달</strong>의 목적으로만 사용됩니다.</p>
            <p>회원 탈퇴 시, 모든 개인정보는 시스템에서 즉시 삭제되어 안전하게 파기됩니다.</p>
          </PolicyCard>
          <PolicyCard title="게시물 유지 정책" icon={Trash2}>
            <p>탈퇴 후에도 작성하신 게시글은 삭제되지 않고 유지됩니다. 단, 작성자 명은 <strong>'탈퇴한 사용자'</strong>로 변경되어 익명화 처리됩니다.</p>
          </PolicyCard>
        </div>
      );
    case 'cookie':
      return (
        <div className="space-y-12">
          <PolicyCard title="쿠키란 무엇인가요?" icon={RefreshCcw}>
            <p>쿠키는 웹사이트를 더 편리하게 이용할 수 있도록 브라우저에 저장되는 작은 정보 조각입니다. 우리 서비스는 광고 추적용 쿠키를 사용하지 않습니다.</p>
          </PolicyCard>
          <PolicyCard title="주요 사용처" icon={MousePointer2}>
            <ul className="list-disc ml-4 space-y-2">
              <li>로그인 상태를 안전하게 유지</li>
              <li>회원님이 선호하는 언어 설정(KR/EN) 유지</li>
            </ul>
          </PolicyCard>
          <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-amber-500" size={20} />
              <h4 className="font-black text-amber-900 dark:text-amber-200">거부 시 안내사항</h4>
            </div>
            <p className="text-sm text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
              쿠키 저장을 거부하실 수 있으나, 이 경우 <strong>새로고침할 때마다 로그아웃</strong>되거나 사용자 설정이 초기화되는 등 이용에 불편함이 있을 수 있습니다.
            </p>
          </div>
        </div>
      );
    case 'legal-notice':
      return (
        <div className="space-y-12">
          <PolicyCard title="정보의 정확성" icon={Scale}>
            <p>커뮤니티 내의 정보는 학습 참고용이며, 공식 시험 기관의 입장과 다를 수 있습니다. 정확한 시험 정보는 반드시 공식 사이트를 확인해 주세요.</p>
          </PolicyCard>
          <PolicyCard title="서비스 중단 안내" icon={AlertTriangle}>
            <p>정기 점검이나 천재지변 등 불가피한 상황에서 서비스가 일시 중단될 수 있습니다. 이로 인한 예기치 못한 손해에 대해서는 책임이 제한됨을 알려드립니다.</p>
          </PolicyCard>
          <PolicyCard title="외부 링크 정책" icon={MousePointer2}>
            <p>게시물 내 포함된 외부 사이트 링크는 사용자의 편의를 위한 것이며, 해당 사이트의 내용이나 신뢰성에 대해서는 우리가 보증하지 않습니다.</p>
          </PolicyCard>
        </div>
      );
  }
}
