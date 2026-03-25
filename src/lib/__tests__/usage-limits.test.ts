import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TIER_LIMITS, getUserTier, checkUsage } from '../usage-limits'
import { supabase } from '../supabase'

// vi.mock is hoisted above imports so `supabase` above is the mocked version
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
    }),
  },
}))

describe('TIER_LIMITS', () => {
  it('free tier has correct caps', () => {
    expect(TIER_LIMITS.free.maxStudentsPerSession).toBe(30)
    expect(TIER_LIMITS.free.maxSessionsPerSemester).toBe(50)
  })

  it('pro and institutional tiers have Infinity limits', () => {
    expect(TIER_LIMITS.pro.maxStudentsPerSession).toBe(Infinity)
    expect(TIER_LIMITS.pro.maxSessionsPerSemester).toBe(Infinity)
    expect(TIER_LIMITS.institutional.maxStudentsPerSession).toBe(Infinity)
    expect(TIER_LIMITS.institutional.maxSessionsPerSemester).toBe(Infinity)
  })
})

describe('getUserTier', () => {
  it('returns free for all users until billing is implemented', () => {
    expect(getUserTier()).toBe('free')
  })
})

describe('checkUsage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('canCreateSession is true when under limit', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: 10, error: null }),
    } as never)

    const status = await checkUsage('user-1')
    expect(status.canCreateSession).toBe(true)
    expect(status.sessionsUsed).toBe(10)
    expect(status.sessionsRemaining).toBe(40)
  })

  it('canCreateSession is false when at limit', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: 50, error: null }),
    } as never)

    const status = await checkUsage('user-1')
    expect(status.canCreateSession).toBe(false)
    expect(status.sessionsRemaining).toBe(0)
  })

  it('nearLimit is true at >= 80% usage', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: 40, error: null }), // 40/50 = 80%
    } as never)

    const status = await checkUsage('user-1')
    expect(status.nearLimit).toBe(true)
  })

  it('nearLimit is false below 80% usage', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: 39, error: null }), // 39/50 = 78%
    } as never)

    const status = await checkUsage('user-1')
    expect(status.nearLimit).toBe(false)
  })

  it('sessionsRemaining never goes below 0', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: 999, error: null }),
    } as never)

    const status = await checkUsage('user-1')
    expect(status.sessionsRemaining).toBe(0)
  })

  it('handles DB error gracefully (count falls back to 0)', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: null, error: { message: 'DB error' } }),
    } as never)

    const status = await checkUsage('user-1')
    expect(status.sessionsUsed).toBe(0)
    expect(status.canCreateSession).toBe(true)
  })
})
