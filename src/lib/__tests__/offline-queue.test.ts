import { describe, it, expect, vi, beforeEach } from 'vitest'
import { enqueue, queueLength, flushQueue, listenForReconnect } from '../offline-queue'
import type { QueuedResponse } from '../offline-queue'

// Mock supabase at the module level
vi.mock('../supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ error: null }),
  },
}))

const makeItem = (overrides: Partial<QueuedResponse> = {}): QueuedResponse => ({
  token: 'tok',
  session_id: 'sess-1',
  participant_id: 'part-1',
  round: 1,
  content: 'hello',
  response_type: 'initial',
  time_taken_ms: 5000,
  queued_at: new Date().toISOString(),
  ...overrides,
})

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('enqueue', () => {
  it('adds an item to the queue', () => {
    enqueue(makeItem())
    expect(queueLength()).toBe(1)
  })

  it('deduplicates by session_id + participant_id + round', () => {
    enqueue(makeItem())
    enqueue(makeItem()) // exact duplicate
    expect(queueLength()).toBe(1)
  })

  it('allows different rounds as separate items', () => {
    enqueue(makeItem({ round: 1 }))
    enqueue(makeItem({ round: 2 }))
    expect(queueLength()).toBe(2)
  })

  it('allows different participants as separate items', () => {
    enqueue(makeItem({ participant_id: 'p1' }))
    enqueue(makeItem({ participant_id: 'p2' }))
    expect(queueLength()).toBe(2)
  })
})

describe('queueLength', () => {
  it('returns 0 when queue is empty', () => {
    expect(queueLength()).toBe(0)
  })

  it('returns the correct count after multiple enqueues', () => {
    enqueue(makeItem({ round: 1 }))
    enqueue(makeItem({ round: 2 }))
    enqueue(makeItem({ round: 3 }))
    expect(queueLength()).toBe(3)
  })
})

describe('flushQueue', () => {
  it('returns 0 and does nothing when queue is empty', async () => {
    const { supabase } = await import('../supabase')
    const flushed = await flushQueue()
    expect(flushed).toBe(0)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('calls supabase.rpc for each item and clears on success', async () => {
    const { supabase } = await import('../supabase')
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null })

    enqueue(makeItem({ round: 1 }))
    enqueue(makeItem({ round: 2 }))

    const flushed = await flushQueue()
    expect(flushed).toBe(2)
    expect(supabase.rpc).toHaveBeenCalledTimes(2)
    expect(queueLength()).toBe(0)
  })

  it('retains items that still fail', async () => {
    const { supabase } = await import('../supabase')
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({ data: null, error: null })   // item 1 succeeds
      .mockResolvedValueOnce({ data: null, error: { message: 'fail' } }) // item 2 fails

    enqueue(makeItem({ round: 1 }))
    enqueue(makeItem({ round: 2 }))

    const flushed = await flushQueue()
    expect(flushed).toBe(1)
    expect(queueLength()).toBe(1)
  })
})

describe('listenForReconnect', () => {
  it('registers online and offline event listeners', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const cleanup = listenForReconnect(vi.fn())
    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    cleanup()
    addSpy.mockRestore()
  })

  it('removes listeners on cleanup', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const cleanup = listenForReconnect(vi.fn())
    cleanup()
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    removeSpy.mockRestore()
  })

  it('calls onStatusChange with online=false when going offline', () => {
    const cb = vi.fn()
    const cleanup = listenForReconnect(cb)
    window.dispatchEvent(new Event('offline'))
    expect(cb).toHaveBeenCalledWith(expect.any(Number), false)
    cleanup()
  })
})
