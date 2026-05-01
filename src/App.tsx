import { createBrowserRouter, RouterProvider, Outlet, useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from "react";
import { Megaphone, BookOpen, Hand, Layout, MessageSquare, Users } from 'lucide-react';
import Board from './components/Board';
import type { BoardItem } from './components/Board';
import Hero from './components/Hero';
import Header from './components/Header';
import Footer from './components/Footer';
import SignUpModal from './components/SignUpModal';
import LoginModal from './components/LoginModal';
import PasswordResetModal from './components/PasswordResetModal'; 
import ExamScheduleModal from './components/ExamScheduleModal'; 
import OpenChat from './components/OpenChat';
import { UserProvider, useUser } from './contexts/UserContext';
import { LanguageProvider, LanguageContext } from './contexts/LanguageContext';
import { AlertProvider, useAlert } from './contexts/AlertContext'; 
import { StompProvider } from './contexts/StompContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatProvider } from './contexts/ChatContext';
import { BoardProvider, useBoard } from './contexts/BoardContext';
import PracticeExams from './pages/PracticeExams';
import ExamDetailPage from './pages/ExamDetailPage';
import WritePostPage from './pages/WritePostPage';
import AdminMemberPage from './pages/AdminMemberPage'; 
import MyPage from './pages/MyPage';
import LegalPage from './pages/LegalPage';
import api from './utils/api';

function Home({ onOpenSchedule }: { onOpenSchedule: () => void }) {
  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;
  const { boardConfigs, isLoading: isBoardLoading } = useBoard();
  
  const [groupedPosts, setGroupedPosts] = useState<Record<string, BoardItem[]>>({});
  const [isPostsLoading, setIsPostsLoading] = useState(true);

  useEffect(() => {
    setIsPostsLoading(true);
    api.get(`/api/board/list`)
      .then((res: any) => {
        if (res) {
          const allPosts = res.map((item: any) => ({
            title: item.title,
            createAt: item.createAt,
            viewCount: item.viewCount,
            likeCount: item.likeCount,
            id: item.boardId,
            author: item.userName,
            authorImage: item.profileImage, 
            boardCode: item.boardCode,
            categoryId: item.categoryId,
            categoryName: item.categoryName,
          }));

          const groups = allPosts.reduce((acc: any, post: BoardItem) => {
            const code = post.boardCode || 'unknown';
            if (!acc[code]) acc[code] = [];
            if (acc[code].length < 5) acc[code].push(post);
            return acc;
          }, {});

          setGroupedPosts(groups);
        }
      })
      .catch(error => console.error("Failed to fetch posts:", error))
      .finally(() => setIsPostsLoading(false));
  }, []);

  const getBoardIcon = (groupCode: string, boardName: string = '') => {
    const code = groupCode?.toUpperCase() || '';
    const name = boardName?.toLowerCase() || '';
    if (code.includes('NOTICE') || name.includes('공지')) return Megaphone;
    if (code.includes('LICENSE') || code.includes('STUDY') || name.includes('학습') || name.includes('시험')) return BookOpen;
    if (code.includes('GREETING') || name.includes('인사')) return Hand;
    if (code.includes('COMMUNITY') || name.includes('커뮤니티') || name.includes('자유')) return MessageSquare;
    if (code.includes('MEMBER') || name.includes('회원')) return Users;
    return Layout;
  };

  const activeBoards = boardConfigs
    .filter(b => b.useYn === 'Y')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-12">
      <Hero getText={getText} onOpenSchedule={onOpenSchedule} />
      <div className={`grid gap-8 mt-12 ${
        activeBoards.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
        activeBoards.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
        'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
      }`}>
        {isBoardLoading || isPostsLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-[400px] bg-white dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-100 dark:border-slate-800 shadow-sm" />
          ))
        ) : activeBoards.map((board, idx) => (
          <div 
            key={board.boardCode} 
            className="animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both"
            style={{ animationDelay: `${idx * 150}ms` }}
          >
            <Board 
              title={board.boardName} 
              icon={getBoardIcon(board.groupCode || '', board.boardName)} 
              items={groupedPosts[board.boardCode] || []} 
              boardCode={board.boardCode} 
            />
          </div>
        ))}
      </div>
    </main>
  );
}

function RootLayout() {
  const { showToast } = useAlert();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);

  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  const openSignUpModal = () => setIsSignUpModalOpen(true);
  const closeSignUpModal = () => setIsSignUpModalOpen(false);
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);
  const openScheduleModal = () => setIsScheduleModalOpen(true);
  const closeScheduleModal = () => setIsScheduleModalOpen(false);
  const openPasswordResetModal = () => setIsPasswordResetModalOpen(true);
  const closePasswordResetModal = () => setIsPasswordResetModalOpen(false);

  const openSignUpFromLogin = () => {
    closeLoginModal();
    openSignUpModal();
  };

  const openPasswordResetFromLogin = () => {
    closeLoginModal();
    openPasswordResetModal();
  };

  useEffect(() => {
    const handleAuthError = (event: any) => {
      const message = event.detail?.message || '세션이 만료되었습니다. 다시 로그인해 주세요.';
      showToast(message, 'warning', 4000);
      navigate('/');
      openLoginModal();
    };

    const handleApiError = (event: any) => {
      const { message, status } = event.detail;
      const duration = status >= 500 ? 5000 : 3000;
      showToast(message, 'error', duration);
    };

    window.addEventListener('auth-error', handleAuthError);
    window.addEventListener('api-error', handleApiError);
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
      window.removeEventListener('api-error', handleApiError);
    };
  }, [showToast, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0d141b] text-slate-900 dark:text-white font-sans transition-colors duration-200">
      <Header 
        onOpenSignUpModal={openSignUpModal} 
        onOpenLoginModal={openLoginModal} 
        onOpenPasswordReset={openPasswordResetModal}
        getText={getText} 
      />
      <div className="flex-1 relative z-0">
        <Outlet context={{ openScheduleModal }} />
      </div>
      <Footer getText={getText} />
      <OpenChat />
      {isSignUpModalOpen && <SignUpModal isOpen={isSignUpModalOpen} onClose={closeSignUpModal} getText={getText} />}
      {isLoginModalOpen && (
        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={closeLoginModal} 
          getText={getText} 
          onOpenSignUpFromLogin={openSignUpFromLogin}
          onOpenPasswordReset={openPasswordResetFromLogin}
        />
      )}
      {isScheduleModalOpen && <ExamScheduleModal isOpen={isScheduleModalOpen} onClose={closeScheduleModal} />}
      {isPasswordResetModalOpen && (
        <PasswordResetModal 
          isOpen={isPasswordResetModalOpen} 
          onClose={closePasswordResetModal} 
          onSuccess={openLoginModal}
        />
      )}
    </div>
  );
}

function HomeWrapper() {
  const { openScheduleModal } = useOutletContext<{ openScheduleModal: () => void }>();
  return <Home onOpenSchedule={openScheduleModal} />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomeWrapper /> },
      { path: "practice-exams", element: <PracticeExams /> },
      { path: "exam/:id", element: <ExamDetailPage /> },
      { path: "write-post", element: <WritePostPage /> },
      { path: "admin/members", element: <AdminMemberPage /> },
      { path: "mypage", element: <MyPage /> },
      { path: "legal", element: <LegalPage /> }
    ],
  },
]);

function AppContent() {
  const { user } = useUser();
  
  // [핵심] user.memberId를 key로 사용하여 계정 전환 시 모든 하위 상태를 물리적으로 폭파/초기화
  return (
    <BoardProvider>
      <StompProvider key={user?.memberId || 'guest'}>
        <NotificationProvider>
          <ChatProvider>
            <RouterProvider router={router} />
          </ChatProvider>
        </NotificationProvider>
      </StompProvider>
    </BoardProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AlertProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </AlertProvider>
    </LanguageProvider>
  );
}

export default App;
