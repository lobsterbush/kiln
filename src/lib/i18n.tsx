/**
 * Lightweight i18n for Kiln — React provider component.
 * Constants, context, and hook live in ./i18n-constants.ts.
 */
import { useState, useCallback, type ReactNode } from 'react'
import { I18nContext, messages, resolve, detectLocale, STORAGE_KEY } from './i18n-constants'
import type { Locale } from './i18n-constants'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.documentElement.lang = l
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      let text = resolve(messages[locale], key)
      if (text === key && locale !== 'en') {
        text = resolve(messages.en, key)
      }
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        }
      }
      return text
    },
    [locale],
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}
