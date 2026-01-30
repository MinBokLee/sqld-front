import { Database, Menu, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-background-dark border-b border-solid border-[#e7edf3] dark:border-slate-800">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-3 flex items-center justify-between gap-4">
        {/* Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-[#0d141b] dark:text-white text-xl font-bold leading-tight tracking-tight hidden sm:block">
              SQLD Community
            </h2>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/" className="text-[#4c739a] hover:text-primary dark:text-slate-400 dark:hover:text-primary text-sm font-semibold transition-colors">
              NOTICE
            </Link>
            <Link to="/practice-exams" className="text-primary dark:text-primary text-sm font-semibold transition-colors">
              SQLD STUDY
            </Link>
            <Link to="/" className="text-[#4c739a] hover:text-primary dark:text-slate-400 dark:hover:text-primary text-sm font-semibold transition-colors">
              JOIN GREETING
            </Link>
          </nav>
        </div>

        {/* Search Bar (Desktop) */}
        <div className="flex-1 max-w-md hidden md:block">
          <label className="relative flex items-center">
            <div className="absolute left-3 text-[#4c739a] pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              className="w-full h-10 pl-10 pr-4 rounded-lg border-none bg-[#e7edf3] dark:bg-slate-800 text-[#0d141b] dark:text-white placeholder:text-[#4c739a] focus:ring-2 focus:ring-primary focus:outline-none text-sm"
              placeholder="Search exam tips or queries..."
            />
          </label>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2">
          <button className="hidden sm:flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-transparent border border-transparent text-[#0d141b] dark:text-white text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span>Login</span>
          </button>
          <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-md hover:bg-blue-600 transition-all">
            <span>Sign up</span>
          </button>
          <button className="lg:hidden p-2 text-[#0d141b] dark:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
