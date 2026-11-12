import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const read = (k, fallback) => {
    try { return localStorage.getItem(k) || fallback; } catch { return fallback; }
  };
  const write = (k, v) => {
    try { localStorage.setItem(k, v); } catch { /* storage unavailable */ }
  };
  const [lang, setLang] = useState(() => (read('cp_lang', 'en') === 'ar' ? 'ar' : 'en'));
  const [darkMode, setDarkMode] = useState(() => read('cp_dark', '0') === '1');
  const t = translations[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);
  const toggleLang = () => {
    const next = lang === 'en' ? 'ar' : 'en';
    setLang(next);
    write('cp_lang', next);
  };
  const toggleDark = () => {
    write('cp_dark', darkMode ? '0' : '1');
    setDarkMode(!darkMode);
  };
  const isAr = lang === 'ar';

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang, isAr, darkMode, toggleDark }}>
      <div dir={isAr ? 'rtl' : 'ltr'} data-theme={darkMode ? 'dark' : 'light'}
        style={{
          fontFamily: isAr ? "'IBM Plex Sans Arabic', 'Plus Jakarta Sans', sans-serif" : "'Plus Jakarta Sans', system-ui, sans-serif",
          background: darkMode ? '#0f0f0f' : '#F3F7FC',
          color: darkMode ? '#f0f0f0' : '#1a1a1a',
          minHeight: '100vh',
          transition: 'all 0.3s'
        }}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLang = () => useContext(LanguageContext);