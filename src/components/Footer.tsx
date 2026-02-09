import { Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[#e7edf3] dark:border-slate-800 bg-white dark:bg-background-dark">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-primary mb-4">
              <Database className="w-6 h-6" />
              <span className="text-lg font-bold text-[#0d141b] dark:text-white">SQLD Community</span>
            </div>
            <p className="text-sm text-[#4c739a] dark:text-slate-400 leading-relaxed max-w-sm">
              The leading community for aspiring SQL Developers. We provide the tools, mock exams, and peer support needed
              to pass your certification.
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-[#0d141b] dark:text-white">Quick Links</h5>
            <ul className="space-y-2 text-sm text-[#4c739a] dark:text-slate-400">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Notice
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  SQLD Study
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Mock Exams
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-[#0d141b] dark:text-white">Legal</h5>
            <ul className="space-y-2 text-sm text-[#4c739a] dark:text-slate-400">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[#e7edf3] dark:border-slate-800 text-center text-xs text-[#4c739a]">
          © 2024 SQLD Community. All rights reserved. Designed for excellence.
        </div>
      </div>
    </footer>
  );
}
