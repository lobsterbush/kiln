import type { StudentToken } from './types'

const STUDENT_TOKEN_KEY = 'kiln_student_token'

/** Generate a 6-character uppercase alphanumeric join code using cryptographic randomness */
export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1 — 32 chars
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  // 256 is exactly divisible by 32, so no modulo bias
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('')
}

/** Generate a UUID-like token for student auth */
export function generateToken(): string {
  return crypto.randomUUID()
}

/** Save student token to localStorage */
export function saveStudentToken(token: StudentToken): void {
  localStorage.setItem(STUDENT_TOKEN_KEY, JSON.stringify(token))
}

/** Get student token from localStorage */
export function getStudentToken(): StudentToken | null {
  const stored = localStorage.getItem(STUDENT_TOKEN_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as StudentToken
  } catch {
    return null
  }
}

/** Clear student token */
export function clearStudentToken(): void {
  localStorage.removeItem(STUDENT_TOKEN_KEY)
}

/** Format seconds as MM:SS */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** cn - simple class name joiner */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
