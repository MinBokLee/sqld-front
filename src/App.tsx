import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Megaphone, BookOpen, Hand, Search } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import Board from './components/Board';
import Footer from './components/Footer';
import PracticeExams from './pages/PracticeExams';

function Home() {
  const notices = [
    { title: "[Notice] 2024 Exam Schedule Announced", date: "2024-01-15" },
    { title: "System Maintenance Notice", date: "2024-01-12" },
    { title: "Guide to SQLD Certification Prep", date: "2024-01-10" },
    { title: "Top 10 FAQ for SQLD Candidates", date: "2024-01-08" },
    { title: "New Study Materials Uploaded", date: "2024-01-05" },
  ];

  const studyPosts = [
    { title: "Difference between UNION and UNION ALL", date: "2024-01-18" },
    { title: "How to optimize subqueries?", date: "2024-01-17" },
    { title: "Self-join examples for beginners", date: "2024-01-16" },
    { title: "Window functions explained with rows", date: "2024-01-15" },
    { title: "My SQLD mock exam results today", date: "2024-01-14" },
  ];

  const greetings = [
    { title: "Hello! Ready to study for the March exam.", date: "2024-01-19" },
    { title: "Newbie developer here, nice to meet you!", date: "2024-01-19" },
    { title: "Aiming for 100% on the SQLD certification.", date: "2024-01-18" },
    { title: "Starting my SQL journey today.", date: "2024-01-18" },
    { title: "Joining from Seoul, SQLD study buddy?", date: "2024-01-17" },
  ];

  return (
    <main className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
      <Hero />

      {/* Boards Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Board title="Notice" icon={Megaphone} items={notices} />
        <Board title="SQLD Study" icon={BookOpen} items={studyPosts} />
        <Board title="Join Greetings" icon={Hand} items={greetings} />
      </div>

      {/* Quick Links / Search Mobile */}
      <div className="mt-12 block md:hidden">
        <h3 className="text-lg font-bold mb-4 px-2">Quick Search</h3>
        <label className="relative flex items-center px-2">
          <div className="absolute left-5 text-[#4c739a] pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-[#cfdbe7] bg-white text-[#0d141b] placeholder:text-[#4c739a] focus:ring-2 focus:ring-primary text-base"
            placeholder="Search for exam tips..."
          />
        </label>
      </div>

      {/* Call to Action Banner */}
      <section className="mt-12 p-8 bg-slate-100 dark:bg-slate-900/40 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h4 className="text-xl font-bold mb-1">Want more study resources?</h4>
          <p className="text-[#4c739a] dark:text-slate-400">
            Join our community and get access to exclusive mock exams.
          </p>
        </div>
        <button className="w-full md:w-auto px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 cursor-pointer">
          Join Community
        </button>
      </section>
    </main>
  );
}


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#0d141b] dark:text-white font-sans transition-colors duration-200">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice-exams" element={<PracticeExams />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;