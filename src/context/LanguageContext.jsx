import { createContext, useEffect, useMemo, useState } from 'react';
import { dashboardTranslations } from '../i18n/dashboardTranslations';

const LANGUAGE_STORAGE_KEY = 'dashboardLanguage';
const supportedLanguages = ['en', 'ar'];

const LanguageContext = createContext(null);

const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  return supportedLanguages.includes(savedLanguage) ? savedLanguage : 'en';
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage);
  const isRtl = language === 'ar';

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [isRtl, language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    isRtl,
    t: dashboardTranslations[language],
  }), [isRtl, language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
