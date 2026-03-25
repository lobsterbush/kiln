import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateJoinCode,
  generateToken,
  saveStudentToken,
  getStudentToken,
  clearStudentToken,
  formatDuration,
  formatTime,
  shuffleArray,
} from '../utils'
import type { StudentToken } from '../types'

// ---------------------------------------------------------------------------
// generateJoinCode
// ---------------------------------------------------------------------------
describe('generateJoinCode', () => {
  const VALID_CHARS = new Set('ABCDEFGHJKLMNPQRSTUVWXYZ23456789')

  it('returns a string of length 6', () => {
    expect(generateJoinCode()).toHaveLength(6)
  })

  it('only uses characters from the allowed set (no I, O, 0, 1)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateJoinCode()
      for (const ch of code) {
        expect(VALID_CHARS.has(ch), `Unexpected char "${ch}" in code "${code}"`).toBe(true)
      }
    }
  })

  it('produces different values on successive calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateJoinCode()))
    expect(codes.size).toBeGreaterThan(1)
  })
})

// ---------------------------------------------------------------------------
// generateToken
// ---------------------------------------------------------------------------
describe('generateToken', () => {
  const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  it('returns a UUID-v4-shaped string via crypto.randomUUID', () => {
    const token = generateToken()
    expect(token).toMatch(UUID_V4_RE)
  })

  it('falls back to manual UUID construction when crypto.randomUUID is absent', () => {
    const original = globalThis.crypto
    // Simulate environment without randomUUID
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) arr[i] = i % 256
          return arr
        },
        randomUUID: undefined,
      },
      configurable: true,
    })
    const token = generateToken()
    expect(token).toMatch(UUID_V4_RE)
    Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true })
  })
})

// ---------------------------------------------------------------------------
// Student token localStorage helpers
// ---------------------------------------------------------------------------
describe('student token storage', () => {
  const sample: StudentToken = {
    participant_id: 'p-123',
    token: 'tok-abc',
    session_id: 'sess-xyz',
    display_name: 'Alice',
  }

  beforeEach(() => localStorage.clear())

  it('getStudentToken returns null when nothing is stored', () => {
    expect(getStudentToken()).toBeNull()
  })

  it('saveStudentToken + getStudentToken round-trips correctly', () => {
    saveStudentToken(sample)
    expect(getStudentToken()).toEqual(sample)
  })

  it('clearStudentToken removes the token', () => {
    saveStudentToken(sample)
    clearStudentToken()
    expect(getStudentToken()).toBeNull()
  })

  it('returns null when localStorage contains corrupt JSON', () => {
    localStorage.setItem('kiln_student_token', '{bad json}')
    expect(getStudentToken()).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------
describe('formatDuration', () => {
  it('formats seconds under 60', () => {
    expect(formatDuration(30)).toBe('30 sec')
    expect(formatDuration(1)).toBe('1 sec')
    expect(formatDuration(59)).toBe('59 sec')
  })

  it('formats exact minutes', () => {
    expect(formatDuration(60)).toBe('1 min')
    expect(formatDuration(120)).toBe('2 min')
  })

  it('formats minutes and remaining seconds', () => {
    expect(formatDuration(90)).toBe('1 min 30 sec')
    expect(formatDuration(75)).toBe('1 min 15 sec')
  })

  it('formats hours', () => {
    expect(formatDuration(3600)).toBe('1 hr')
    expect(formatDuration(7200)).toBe('2 hr')
  })
})

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------
describe('formatTime', () => {
  it('formats MM:SS with zero-padding', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(9)).toBe('0:09')
    expect(formatTime(60)).toBe('1:00')
    expect(formatTime(75)).toBe('1:15')
    expect(formatTime(3599)).toBe('59:59')
  })
})

// ---------------------------------------------------------------------------
// shuffleArray
// ---------------------------------------------------------------------------
describe('shuffleArray', () => {
  it('returns a new array (does not mutate original)', () => {
    const orig = [1, 2, 3, 4, 5]
    const copy = [...orig]
    shuffleArray(orig)
    expect(orig).toEqual(copy)
  })

  it('returns an array with the same length', () => {
    const arr = [1, 2, 3, 4]
    expect(shuffleArray(arr)).toHaveLength(arr.length)
  })

  it('contains all original elements', () => {
    const arr = [10, 20, 30, 40, 50]
    const shuffled = shuffleArray(arr)
    expect(shuffled.sort()).toEqual([...arr].sort())
  })

  it('handles empty arrays', () => {
    expect(shuffleArray([])).toEqual([])
  })

  it('handles single-element arrays', () => {
    expect(shuffleArray([42])).toEqual([42])
  })
})
