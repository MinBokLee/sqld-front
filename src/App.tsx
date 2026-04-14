import { createBrowserRouter, RouterProvider, Outlet, useOutletContext } from 'react-router-dom';
import { useState, useEffect, useContext } from "react";
import { Megaphone, BookOpen, Hand } from 'lucide-react';
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
import { UserProvider } from './contexts/UserContext';
import { LanguageProvider, LanguageContext } from './contexts/LanguageContext';
import { AlertProvider } from './contexts/AlertContext'; 
import { StompProvider } from './contexts/StompContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatProvider } from './contexts/ChatContext';
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
  const [noticesPosts, setNoticesPosts] = useState<BoardItem[]>([]);
  const [sqldStudyPosts, setSqldStudyPosts] = useState<BoardItem[]>([]);
  const [greetingsPosts, setGreetingsPosts] = useState<BoardItem[]>([]);

  useEffect(() => {
    api.get(`/api/board/list`)
      .then((res) => {
        if (res.data.success && res.data.result?.data) {
          const allPosts = res.data.result.data.map((item: any) => ({
            title: item.title,
            createAt: item.createAt,
            viewCount: item.viewCount,
            likeCount: item.likeCount,
            id: item.boardId,
            author: item.userName,
            authorImage: item.profileImage, 
            boardType: item.boardType,
            category: item.category,
          }));

          setNoticesPosts(allPosts.filter((item: BoardItem) => item.boardType === 'N').slice(0, 5));
          setSqldStudyPosts(allPosts.filter((item: BoardItem) => item.boardType === 'S').slice(0, 5));
          setGreetingsPosts(allPosts.filter((item: BoardItem) => item.boardType === 'G').slice(0, 5));
        }
      })
      .catch(error => console.error("Failed to fetch posts:", error));
  }, []);

  return (
    <main className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
      <Hero getText={getText} onOpenSchedule={onOpenSchedule} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Board title={getText('board.notice')} icon={Megaphone} items={noticesPosts} boardType="N" />
        <Board title={getText('board.sqld_study')} icon={BookOpen} items={sqldStudyPosts} boardType="S" />
        <Board title={getText('board.join_greetings')} icon={Hand} items={greetingsPosts} boardType="G" />
      </div>
    </main>
  );
}

/**
 * [RootLayout]
 * 기존 AppContent의 UI 구조를 100% 보존합니다.
 */
function RootLayout() {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);

  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

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
      
      {/* Global Open Chat */}
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
      {
        index: true,
        element: <HomeWrapper />,
      },
      {
        path: "practice-exams",
        element: <PracticeExams />,
      },
      {
        path: "exam/:id",
        element: <ExamDetailPage />,
      },
      {
        path: "write-post",
        element: <WritePostPage />,
      },
      {
        path: "admin/members",
        element: <AdminMemberPage />,
      },
      {
        path: "mypage",
        element: <MyPage />,
      },
      {
        path: "legal",
        element: <LegalPage />,
      }
    ],
  },
]);

function App() {
  return (
    <LanguageProvider>
      <AlertProvider>
        <UserProvider>
          <StompProvider>
            <NotificationProvider>
              <ChatProvider>
                <RouterProvider router={router} />
              </ChatProvider>
            </NotificationProvider>
          </StompProvider>
        </UserProvider>
      </AlertProvider>
    </LanguageProvider>
  );
}

export default App;

