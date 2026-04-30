'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Lang } from './i18n';

const LangContext = createContext<{ lang: Lang; toggle: () => void }>({ lang: 'ar', toggle: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar');

  useEffect(() => {
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = () => setLang(l => l === 'ar' ? 'en' : 'ar');

  return <LangContext.Provider value={{ lang, toggle }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
