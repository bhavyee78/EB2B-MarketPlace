'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations } from '@/lib/i18n';

type Locale = 'en' | 'hi' | 'fr';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    // Initialize language from localStorage or browser
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && ['en', 'hi', 'fr'].includes(savedLanguage)) {
      setLocale(savedLanguage as Locale);
    } else {
      // Fallback to browser locale
      const browserLang = navigator.language.split('-')[0];
      if (['en', 'hi', 'fr'].includes(browserLang)) {
        setLocale(browserLang as Locale);
      }
    }
  }, []);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if no translation found
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};