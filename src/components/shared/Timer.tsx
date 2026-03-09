import { useEffect, useState } from 'react'
import { getRemainingSeconds, formatTime, cn } from '../../lib/utils'

interface TimerProps {
  serverTimestamp: string
  durationSec: number
  onExpire?: () => void
  className?: string
}

export function Timer({ serverTimestamp, durationSec, onExpire, className }: TimerProps) {
  const [remaining, setRemaining] = useState(() =>
    getRemainingSeconds(serverTimestamp, durationSec)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const r = getRemainingSeconds(serverTimestamp, durationSec)
      setRemaining(r)
      if (r <= 0) {
        clearInterval(interval)
        onExpire?.()
      }
    }, 250) // update 4x/sec for smooth countdown

    return () => clearInterval(interval)
  }, [serverTimestamp, durationSec, onExpire])

  const pct = (remaining / durationSec) * 100
  const isUrgent = remaining <= 10
  const isWarning = remaining <= 30 && !isUrgent

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className={cn(
          'text-4xl font-mono font-bold tabular-nums transition-colors',
          isUrgent && 'text-red-600',
          isWarning && 'text-amber-500',
          !isUrgent && !isWarning && 'text-slate-800'
        )}
      >
        {formatTime(remaining)}
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            isUrgent && 'bg-red-500',
            isWarning && 'bg-amber-400',
            !isUrgent && !isWarning && 'bg-emerald-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
