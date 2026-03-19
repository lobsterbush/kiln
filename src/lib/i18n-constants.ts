import { createContext, useContext } from 'react'

import en from '../locales/en.json'
import ko from '../locales/ko.json'
import ja from '../locales/ja.json'

/** Supported locale codes. */
export type Locale = 'en' | 'ko' | 'ja'

/** Locale metadata for the language switcher. */
export const LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
]

export interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)

type Messages = Record<string, Record<string, string>>

export const messages: Record<Locale, Messages> = {
  en: en as unknown as Messages,
  ko: ko as unknown as Messages,
  ja: ja as unknown as Messages,
}

/** Resolve a dot-separated key like "student.submit" from nested messages. */
export function resolve(msgs: Messages, key: string): string {
  const [ns, ...rest] = key.split('.')
  const section = msgs[ns]
  if (!section) return key
  const value = section[rest.join('.')]
  return value ?? key
}

export const STORAGE_KEY = 'kiln_locale'

/** Detect locale from localStorage → browser → default 'en'. */
export function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
  if (stored && stored in messages) return stored
  const browserLang = navigator.language.split('-')[0]
  if (browserLang in messages) return browserLang as Locale
  return 'en'
}

/** Hook to access translations. */
export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}
