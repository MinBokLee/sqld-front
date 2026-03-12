import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type Language = 'ko' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  getText: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// TODO: Define translations here
export const translations: Record<Language, Record<string, string>> = {
  ko: {
    'common.signup': '회원가입',
    'common.login': '로그인',
    'common.cancel': '취소',
    'common.check_duplicate': '중복 확인',
    'common.verify': '인증하기',
    'common.logout': '로그아웃', // New key
    'signup.title': 'SQLD 커뮤니티 가입',
    'signup.subtitle': 'SQL 개발자 자격증 합격을 위한 최고의 커뮤니티에 합류하세요.',
    'signup.id': '아이디',
    'signup.id_placeholder': '사용하실 아이디를 입력해 주세요', // More polite
    'signup.password': '비밀번호',
    'signup.password_placeholder': '•••••••••••••••',
    'signup.password_info': '특수문자를 포함하여 15자 이상 입력해 주세요.',
    'signup.name': '이름',
    'signup.name_placeholder': '홍길동 님', // More polite
    'signup.email': '이메일',
    'signup.email_placeholder': 'example@이메일.com',
    'signup.already_have_account': '이미 계정이 있으신가요?',
    'signup.login_link': '로그인',
    'common.home': '홈',
    'board.no': '#',
    'board.subject': '제목',
    'board.author': '글쓴이',
    'board.date': '작성일',
    'board.views': '조회',
    'board.likes': '추천',
    'board.total_start': '전체',
    'board.total_end': '개의 게시글',
    'board.page': '페이지',
    'board.loading': '게시글을 불러오는 중...',
    'board.notice': '공지사항',
    'board.sqld_study': 'SQLD 학습',
    'board.join_greetings': '가입 인사',
    'board.popular': '인기 게시글',
    'board.category.all': '전체',
    'board.category.question': '질문',
    'board.category.tip': '팁',
    'board.category.faq': '자주 묻는 질문',
    'hero.title': 'SQLD 자격증, 합격으로 이끄는 커뮤니티',
    'hero.subtitle_1': 'SQL 개발자 지망생을 위한 최고의 커뮤니티입니다.',
    'hero.subtitle_2': '시험을 준비 하는 모든 분들께 도움이 되었으면 합니다.',
    'hero.start_learning': '학습 시작',
    'hero.exam_schedule': '시험 일정',
    'hero.next_exam': '다음 시험',
    'quick_search.title': '빠른 검색',
    'quick_search.placeholder': '시험 팁이나 쿼리를 검색해 주세요...', // More polite
    'cta.title': '더 많은 학습 자료를 원하시나요?',
    'cta.subtitle': '저희 커뮤니티에 가입하고 독점 모의고사를 이용해 보세요.', // More polite
    'footer.title': 'SQLD Community',
    'footer.description': 'SQL 개발자 지망생을 위한 최고의 커뮤니티입니다. 시험을 준비 하는 모든 분들께 도움이 되었으면 합니다.',
    'footer.quick_links': '빠른 링크',
    'footer.notice': '공지사항',
    'footer.sqld_study_link': 'SQLD 학습',
    'footer.mock_exams': '모의고사',
    'footer.faq': '자주 묻는 질문',
    'footer.legal': '법률',
    'footer.privacy_policy': '개인정보처리방침',
    'footer.terms_of_service': '서비스 약관',
    'footer.cookie_policy': '쿠키 정책',
    'footer.copyright': '© 2026 SQLD Community. 모든 권리 보유. 우수성을 위해 설계되었습니다.',
    'validation.id_required': '아이디는 필수 입력 사항입니다.',
    'validation.id_min_length': '아이디는 최소 4자 이상 입력해 주세요.',
    'validation.id_max_length': '아이디는 최대 20자까지 입력 가능합니다.',
    'validation.id_invalid_chars': '아이디는 영문, 숫자, 밑줄(_)만 사용 가능합니다.',
    'validation.password_required': '비밀번호는 필수 입력 사항입니다.',
    'validation.password_min_length': '비밀번호는 최소 15자 이상 입력해 주세요.',
    'validation.password_special_char': '비밀번호에 특수문자를 포함해 주세요.',
    'validation.password_uppercase': '비밀번호에 대문자를 포함해 주세요.',
    'validation.password_lowercase': '비밀번호에 소문자를 포함해 주세요.',
    'validation.password_number': '비밀번호에 숫자를 포함해 주세요.',
    'validation.email_required': '이메일은 필수 입력 사항입니다.',
    'validation.email_invalid_format': '유효한 이메일 형식으로 입력해 주세요.',
    'validation.name_required': '이름은 필수 입력 사항입니다.',
    'login.title': '로그인',
    'login.subtitle': 'SQLD 자격증 합격을 위한 첫 걸음',
    'login.id': '아이디',
    'login.id_placeholder': '아이디를 입력하세요',
    'login.password': '비밀번호',
    'login.password_placeholder': '비밀번호를 입력하세요',
    'login.remember_me': '로그인 상태 유지',
    'login.find_credentials': '아이디/비밀번호 찾기',
    'login.social_login': 'SNS 로그인',
    'login.kakao_login': '카카오 로그인',
    'login.naver_login': '네이버 로그인',
    'login.no_account_yet': '계정이 없으신가요?',
  },
  en: {
    'common.signup': 'Sign Up',
    'common.login': 'Login',
    'common.cancel': 'Cancel',
    'common.check_duplicate': 'Check Duplicate',
    'common.verify': 'Verify',
    'common.logout': 'Logout', // New key
    'signup.title': 'Join SQLD Community',
    'signup.subtitle': 'Join the best community for passing the SQLD certification exam.',
    'signup.id': 'ID',
    'signup.id_placeholder': 'Enter your ID',
    'signup.password': 'Password',
    'signup.password_placeholder': '•••••••••••••••',
    'signup.password_info': 'Include special characters and be at least 15 characters long.',
    'signup.name': 'Name',
    'signup.name_placeholder': 'John Doe',
    'signup.email': 'Email Address',
    'signup.email_placeholder': 'example@email.com',
    'signup.already_have_account': 'Already have an account?',
    'signup.login_link': 'Login',
    'board.notice': 'Notice',
    'board.sqld_study': 'SQLD Study',
    'board.join_greetings': 'Join Greetings',
    'board.popular': 'Popular Posts',
    'hero.title': 'Master your SQLD Exam',
    'hero.subtitle': 'Join over 10,000 developers sharing mock exams, subquery tips, and study strategies.',
    'hero.start_learning': 'Start Learning',
    'hero.exam_schedule': 'Exam Schedule',
    'hero.next_exam': 'Next Exam',
    'quick_search.title': 'Quick Search',
    'quick_search.placeholder': 'Search exam tips or queries...',
    'cta.title': 'Want more study resources?',
    'cta.subtitle': 'Join our community and get access to exclusive mock exams.',
    'footer.title': 'SQLD Community',
    'footer.description': 'The leading community for aspiring SQL Developers. We provide the tools, mock exams, and peer support needed to pass your certification.',
    'footer.quick_links': 'Quick Links',
    'footer.notice': 'Notice',
    'footer.sqld_study_link': 'SQLD Study',
    'footer.mock_exams': 'Mock Exams',
    'footer.faq': 'FAQ',
    'footer.legal': 'Legal',
    'footer.privacy_policy': 'Privacy Policy',
    'footer.terms_of_service': 'Terms of Service',
    'footer.cookie_policy': 'Cookie Policy',
    'footer.copyright': '© 2024 SQLD Community. All rights reserved. Designed for excellence.',
    'login.title': 'Login',
    'login.subtitle': 'First step to passing your SQLD certification',
    'login.id': 'ID',
    'login.id_placeholder': 'Enter your ID',
    'login.password': 'Password',
    'login.password_placeholder': 'Enter your password',
    'login.remember_me': 'Remember me',
    'login.find_credentials': 'Find ID/Password',
    'login.social_login': 'Social Login',
    'login.kakao_login': 'Kakao Login',
    'login.naver_login': 'Naver Login',
    'login.no_account_yet': 'Don\'t have an account yet?',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko'); // Default to Korean

  const getText = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    // Optionally, load language from localStorage or user settings
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang && ['ko', 'en'].includes(storedLang)) {
      setLanguage(storedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, getText }}>
      {children}
    </LanguageContext.Provider>
  );
};
