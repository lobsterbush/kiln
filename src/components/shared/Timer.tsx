import { useEffect, useState, useRef } from 'react'
import { formatTime, cn } from '../../lib/utils'

interface TimerProps {
  serverTimestamp: string
  durationSec: number
  onExpire?: () => void
  className?: string
}

export function Timer({ serverTimestamp, durationSec, onExpire, className }: TimerProps) {
  // Compute initial remaining from server timestamp, clamped to [0, durationSec].
  // This absorbs clock skew at the start; subsequent ticks use purely local time delta
  // to avoid drift from ongoing skew accumulation.
  // Refs are initialised with placeholder values; the first useEffect below sets the
  // real values. This avoids calling Date.now() during render (React purity rule).
  const localStartRef = useRef(0)
  const initialRemainingRef = useRef(durationSec)
  // Guard: onExpire must fire at most once per round even if the effect re-runs
  // (e.g. when onExpire reference changes due to parent re-renders from keystroke state)
  const firedRef = useRef(false)

  const [remaining, setRemaining] = useState(durationSec)

  // Reset refs when serverTimestamp or durationSec changes (new round)
  useEffect(() => {
    const now = Date.now()
    localStartRef.current = now
    initialRemainingRef.current = Math.max(0, Math.min(durationSec,
      Math.ceil(durationSec - (now - new Date(serverTimestamp).getTime()) / 1000)
    ))
    firedRef.current = false
    setRemaining(initialRemainingRef.current)
  }, [serverTimestamp, durationSec])

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedSec = (Date.now() - localStartRef.current) / 1000
      const r = Math.max(0, Math.ceil(initialRemainingRef.current - elapsedSec))
      setRemaining(r)
      if (r <= 0) {
        clearInterval(interval)
        if (!firedRef.current) {
          firedRef.current = true
          onExpire?.()
        }
      }
    }, 250)

    return () => clearInterval(interval)
  }, [serverTimestamp, durationSec, onExpire])

  const pct = (remaining / durationSec) * 100
  const isUrgent = remaining <= 10
  const isWarning = remaining <= 30 && !isUrgent

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(
          'text-5xl font-mono font-bold tabular-nums transition-colors tracking-tight',
          isUrgent && 'text-red-600 timer-urgent',
          isWarning && 'text-amber-500',
          !isUrgent && !isWarning && 'text-slate-800'
        )}
      >
        {formatTime(remaining)}
      </div>
      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 relative',
            isUrgent && 'bg-red-500',
            isWarning && 'bg-amber-400',
            !isUrgent && !isWarning && 'bg-gradient-to-r from-emerald-400 to-emerald-500'
          )}
          style={{ width: `${pct}%` }}
        >
          <div className="progress-shimmer absolute inset-0 rounded-full" />
        </div>
      </div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
        {isUrgent ? 'Time almost up!' : isWarning ? 'Wrapping up...' : 'Time remaining'}
      </p>
    </div>
  )
}
