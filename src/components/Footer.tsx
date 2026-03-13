import { Database } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterProps {
  getText: (key: string) => string;
}

export default function Footer({ getText }: FooterProps) {
  return (
    <footer className="mt-20 border-t border-[#e7edf3] dark:border-slate-800 bg-white dark:bg-background-dark">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-primary mb-4">
              <Database className="w-6 h-6" />
              <span className="text-lg font-bold text-[#0d141b] dark:text-white">{getText('footer.title')}</span>
            </div>
            <p className="text-sm text-[#4c739a] dark:text-slate-400 leading-relaxed max-w-sm">
              {getText('footer.description')}
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-[#0d141b] dark:text-white">{getText('footer.quick_links')}</h5>
            <ul className="space-y-2 text-sm text-[#4c739a] dark:text-slate-400">
              <li>
                <Link to="/practice-exams?type=N" className="hover:text-primary transition-colors">
                  {getText('footer.notice')}
                </Link>
              </li>
              <li>
                <Link to="/practice-exams?type=S" className="hover:text-primary transition-colors">
                  {getText('footer.sqld_study_link')}
                </Link>
              </li>
              <li>
                <Link to="/practice-exams?type=G" className="hover:text-primary transition-colors">
                  {getText('board.join_greetings')}
                </Link>
              </li>
              <li>
                <Link to="/practice-exams?type=S&category=faq" className="hover:text-primary transition-colors">
                  {getText('footer.faq')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-[#0d141b] dark:text-white">{getText('footer.legal')}</h5>
            <ul className="space-y-2 text-sm text-[#4c739a] dark:text-slate-400">
              <li>
                <Link to="/legal?tab=privacy" className="hover:text-primary transition-colors">
                  {getText('footer.privacy_policy')}
                </Link>
              </li>
              <li>
                <Link to="/legal?tab=terms" className="hover:text-primary transition-colors">
                  {getText('footer.terms_of_service')}
                </Link>
              </li>
              <li>
                <Link to="/legal?tab=cookie" className="hover:text-primary transition-colors">
                  {getText('footer.cookie_policy')}
                </Link>
              </li>
              <li>
                <Link to="/legal?tab=legal-notice" className="hover:text-primary transition-colors">
                  공식 고지사항
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[#e7edf3] dark:border-slate-800 text-center text-xs text-[#4c739a]">
          {getText('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
