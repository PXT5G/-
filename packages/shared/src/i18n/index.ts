import type { TranslationDict, TranslationKey, PluralForms } from './types';
import { en } from './locales/en';
import { ar } from './locales/ar';
import {
  fr, de, es, it, pt, tr, ru, ja, zh, ko, hi, ur, fa,
} from './locales/index';

export const SUPPORTED_LANGUAGE_CODES = [
  'ar', 'en', 'fr', 'de', 'es', 'it', 'pt', 'tr', 'ru', 'ja', 'zh', 'ko', 'hi', 'ur', 'fa',
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export const RTL_LANGUAGES: SupportedLanguageCode[] = ['ar', 'ur', 'fa'];

const localeMap: Record<string, TranslationDict> = {
  ar, en, fr, de, es, it, pt, tr, ru, ja, zh, ko, hi, ur, fa,
};

export function isRTL(code: string): boolean {
  return RTL_LANGUAGES.includes(code as SupportedLanguageCode);
}

export function getTranslations(code: string): TranslationDict {
  return localeMap[code] ?? en;
}

function resolveKey(dict: TranslationDict, key: TranslationKey): string {
  const [section, field] = key.split('.') as [keyof TranslationDict, string];
  const sectionDict = dict[section] as Record<string, string>;
  return sectionDict[field] ?? key;
}

export function t(dict: TranslationDict, key: TranslationKey, params?: Record<string, string | number>): string {
  let text = resolveKey(dict, key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export function plural(count: number, forms: PluralForms): string {
  if (count === 0 && forms.zero) return forms.zero;
  if (count === 1) return forms.one;
  return forms.other;
}

export { en, ar, fr, de, es, it, pt, tr, ru, ja, zh, ko, hi, ur, fa };
export type { TranslationDict, TranslationKey, PluralForms };
