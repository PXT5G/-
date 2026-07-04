import { create } from 'zustand';
import { getTranslations, isRTL, t, type TranslationDict, type TranslationKey } from '@bananaos/shared';

interface I18nState {
  language: string;
  translations: TranslationDict;
  setLanguage: (code: string) => void;
  translate: (key: TranslationKey, params?: Record<string, string | number>) => string;
  rtl: boolean;
}

export const useI18nStore = create<I18nState>((set, get) => ({
  language: 'en',
  translations: getTranslations('en'),
  rtl: false,
  setLanguage: (code) => {
    const translations = getTranslations(code);
    set({ language: code, translations, rtl: isRTL(code) });
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', code);
      document.documentElement.setAttribute('dir', isRTL(code) ? 'rtl' : 'ltr');
    }
  },
  translate: (key, params) => t(get().translations, key, params),
}));

export function useTranslation() {
  const language = useI18nStore((s) => s.language);
  const rtl = useI18nStore((s) => s.rtl);
  const translate = useI18nStore((s) => s.translate);
  return { language, rtl, t: translate };
}
