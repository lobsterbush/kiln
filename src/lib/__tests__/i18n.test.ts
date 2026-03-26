import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resolve, detectLocale, LOCALES, STORAGE_KEY, messages } from '../i18n-constants'

describe('resolve', () => {
  const msgs = { student: { submit: 'Submit', 'typeResponse': 'Type your response...' } }

  it('resolves a simple dot-separated key', () => {
    expect(resolve(msgs, 'student.submit')).toBe('Submit')
  })

  it('returns the key itself when the namespace is missing', () => {
    expect(resolve(msgs, 'unknown.key')).toBe('unknown.key')
  })

  it('returns the key when the sub-key is missing', () => {
    expect(resolve(msgs, 'student.missing')).toBe('student.missing')
  })

  it('handles multi-segment sub-keys', () => {
    expect(resolve(msgs, 'student.typeResponse')).toBe('Type your response...')
  })
})

describe('detectLocale', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns stored locale when valid', () => {
    localStorage.setItem(STORAGE_KEY, 'ko')
    expect(detectLocale()).toBe('ko')
  })

  it('ignores invalid stored locale and falls back to browser', () => {
    localStorage.setItem(STORAGE_KEY, 'fr')
    // Default navigator.language is 'en' in jsdom
    expect(detectLocale()).toBe('en')
  })

  it('uses browser language when no stored value', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP')
    expect(detectLocale()).toBe('ja')
    vi.restoreAllMocks()
  })

  it('falls back to en for unsupported browser language', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE')
    expect(detectLocale()).toBe('en')
    vi.restoreAllMocks()
  })
})

describe('LOCALES', () => {
  it('has entries for en, ko, ja', () => {
    const codes = LOCALES.map((l) => l.code)
    expect(codes).toEqual(['en', 'ko', 'ja'])
  })
})

describe('messages', () => {
  it('has message bundles for all supported locales', () => {
    expect(Object.keys(messages)).toEqual(['en', 'ko', 'ja'])
  })

  it('all locales have a nav namespace', () => {
    for (const locale of Object.keys(messages)) {
      expect(messages[locale as keyof typeof messages]).toHaveProperty('nav')
    }
  })
})
