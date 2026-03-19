/**
 * Usage-based soft limits for Kiln's free tier.
 *
 * Free tier limits:
 *   - 30 students per session
 *   - 50 sessions per semester (rolling 6-month window)
 *
 * These are "soft" limits — they warn and block session creation
 * but don't delete data or disrupt active sessions.
 */
import { supabase } from './supabase'

export type Tier = 'free' | 'pro' | 'institutional'

export interface UsageLimits {
  maxStudentsPerSession: number
  maxSessionsPerSemester: number
}

export const TIER_LIMITS: Record<Tier, UsageLimits> = {
  free: { maxStudentsPerSession: 30, maxSessionsPerSemester: 50 },
  pro: { maxStudentsPerSession: Infinity, maxSessionsPerSemester: Infinity },
  institutional: { maxStudentsPerSession: Infinity, maxSessionsPerSemester: Infinity },
}

/** Get the current user's tier. For now, everyone is free. */
export function getUserTier(): Tier {
  // TODO: Check instructor profile table for tier when billing is implemented
  return 'free'
}

/** Count sessions created in the last 6 months for this instructor. */
export async function getSemesterSessionCount(instructorId: string): Promise<number> {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { count, error } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('instructor_id', instructorId)
    .gte('created_at', sixMonthsAgo.toISOString())

  if (error) return 0
  return count ?? 0
}

export interface UsageStatus {
  tier: Tier
  limits: UsageLimits
  sessionsUsed: number
  sessionsRemaining: number
  canCreateSession: boolean
  nearLimit: boolean // true when ≥80% of session limit used
}

/** Check the instructor's current usage against their tier limits. */
export async function checkUsage(instructorId: string): Promise<UsageStatus> {
  const tier = getUserTier()
  const limits = TIER_LIMITS[tier]
  const sessionsUsed = await getSemesterSessionCount(instructorId)
  const sessionsRemaining = Math.max(0, limits.maxSessionsPerSemester - sessionsUsed)
  const canCreateSession = sessionsRemaining > 0
  const nearLimit = limits.maxSessionsPerSemester !== Infinity &&
    sessionsUsed >= limits.maxSessionsPerSemester * 0.8

  return { tier, limits, sessionsUsed, sessionsRemaining, canCreateSession, nearLimit }
}
