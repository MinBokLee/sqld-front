import { Database } from 'lucide-react';

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
                <a href="#" className="hover:text-primary transition-colors">
                  {getText('footer.notice')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  {getText('footer.sqld_study_link')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  {getText('footer.mock_exams')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  {getText('footer.faq')}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-[#0d141b] dark:text-white">{getText('footer.legal')}</h5>
            <ul className="space-y-2 text-sm text-[#4c739a] dark:text-slate-400">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  {getText('footer.privacy_policy')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  {getText('footer.terms_of_service')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  {getText('footer.cookie_policy')}
                </a>
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
