'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';

interface Language {
  code: 'en' | 'hi' | 'fr';
  name: string;
  flag: string;
}

const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { locale, setLocale } = useI18n();
  const { user, updateUserLocale } = useAuth();

  const currentLanguage = supportedLanguages.find(lang => lang.code === locale) || supportedLanguages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = async (language: Language) => {
    if (language.code === locale) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Update local state immediately
      setLocale(language.code);
      
      // Save to localStorage for non-authenticated users
      localStorage.setItem('preferredLanguage', language.code);
      
      // Update user preference if logged in
      if (user && updateUserLocale) {
        try {
          await updateUserLocale(language.code);
        } catch (error) {
          console.error('Failed to update user language preference:', error);
        }
      }
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg flex items-center space-x-1 transition-colors"
        disabled={isLoading}
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">
          {currentLanguage.flag} {currentLanguage.name}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
            Select Language
          </div>
          {supportedLanguages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageSelect(language)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                language.code === locale ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
              disabled={isLoading}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
              </div>
              {language.code === locale && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          ))}
          
          {user && (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100 mt-1">
              Language preference will be saved to your account
            </div>
          )}
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}