/**
 * Offline response queue — stores failed response submissions in localStorage
 * and flushes them when the network comes back online.
 */
import { supabase } from './supabase'

const STORAGE_KEY = 'kiln_offline_queue'

export interface QueuedResponse {
  token: string
  session_id: string
  participant_id: string
  round: number
  content: string
  response_type: string
  time_taken_ms: number
  queued_at: string
}

/** Read queued items from localStorage. */
function readQueue(): QueuedResponse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as QueuedResponse[]) : []
  } catch {
    return []
  }
}

/** Write the queue to localStorage. */
function writeQueue(items: QueuedResponse[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

/** Add a response to the offline queue. */
export function enqueue(item: QueuedResponse) {
  const queue = readQueue()
  // Dedup by session + participant + round
  const exists = queue.some(
    (q) =>
      q.session_id === item.session_id &&
      q.participant_id === item.participant_id &&
      q.round === item.round,
  )
  if (!exists) {
    queue.push(item)
    writeQueue(queue)
  }
}

/** Get the current queue length (for UI display). */
export function queueLength(): number {
  return readQueue().length
}

/**
 * Attempt to submit all queued responses. Returns the number that
 * were successfully flushed.
 */
export async function flushQueue(): Promise<number> {
  const queue = readQueue()
  if (queue.length === 0) return 0

  const remaining: QueuedResponse[] = []
  let flushed = 0

  for (const item of queue) {
    const { error } = await supabase.rpc('submit_response', {
      p_token: item.token,
      p_session_id: item.session_id,
      p_participant_id: item.participant_id,
      p_round: item.round,
      p_content: item.content,
      p_response_type: item.response_type,
      p_time_taken_ms: item.time_taken_ms,
    })
    if (error) {
      // Keep items that still fail (e.g. server is still down)
      remaining.push(item)
    } else {
      flushed++
    }
  }

  writeQueue(remaining)
  return flushed
}

/**
 * Register online/offline listeners. Returns a cleanup function.
 * `onStatusChange` fires with the current queue length whenever
 * the connection state changes or items are flushed.
 */
export function listenForReconnect(
  onStatusChange: (queueLen: number, online: boolean) => void,
): () => void {
  async function handleOnline() {
    await flushQueue()
    onStatusChange(queueLength(), true)
  }

  function handleOffline() {
    onStatusChange(queueLength(), false)
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
