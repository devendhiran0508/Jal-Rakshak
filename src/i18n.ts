import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hi from './locales/hi.json';

const resources = {
  en: {
    translation: en
  },
  hi: {
    translation: hi
  }
};

const initI18n = async () => {
  let savedLanguage = 'en';
  try {
    savedLanguage = localStorage.getItem('language') || 'en';
  } catch (error) {
    console.warn('Could not access localStorage for language preference');
  }

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      lng: savedLanguage,
      
      interpolation: {
        escapeValue: false
      },

      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage']
      }
    });
};

// Initialize i18n
initI18n().catch(console.error);

export default i18n;