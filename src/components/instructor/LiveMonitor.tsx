import { Timer } from '../shared/Timer'
import type { Response, Participant } from '../../lib/types'
import { cn } from '../../lib/utils'

interface LiveMonitorProps {
  participants: Participant[]
  responses: Response[]
  currentRound: number
  serverTimestamp: string | null
  durationSec: number
  onAdvanceRound: () => void
  onEndSession: () => void
  onRoundExpire: () => void
  sessionStatus: string
}

export function LiveMonitor({
  participants,
  responses,
  currentRound,
  serverTimestamp,
  durationSec,
  onAdvanceRound,
  onEndSession,
  onRoundExpire,
  sessionStatus,
}: LiveMonitorProps) {
  const roundResponses = responses.filter((r) => r.round === currentRound)
  const submittedCount = roundResponses.length
  const totalCount = participants.length

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Round {currentRound}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            <span className="font-semibold text-kiln-600">{submittedCount}</span>/{totalCount} submitted
          </p>
        </div>

        {serverTimestamp && (
          <Timer
            serverTimestamp={serverTimestamp}
            durationSec={durationSec}
            onExpire={onRoundExpire}
            className="w-48"
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-kiln-400 to-kiln-500 rounded-full transition-all duration-500 relative"
          style={{ width: `${totalCount > 0 ? (submittedCount / totalCount) * 100 : 0}%` }}
        >
          <div className="progress-shimmer absolute inset-0 rounded-full" />
        </div>
      </div>

      {/* Response grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
        {participants.map((p) => {
          const response = roundResponses.find((r) => r.participant_id === p.id)
          return (
            <div
              key={p.id}
              className={cn(
                'rounded-2xl border p-4 transition-all duration-200',
                response
                  ? 'bg-white border-emerald-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">{p.display_name}</span>
                {response ? (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-medium">
                    ✓ Submitted
                  </span>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium animate-pulse">
                    Writing…
                  </span>
                )}
              </div>
              {response && (
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{response.content}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-end">
        {sessionStatus === 'between_rounds' && (
          <button
            onClick={onAdvanceRound}
            className="px-6 py-2.5 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white font-medium rounded-xl hover:from-kiln-600 hover:to-kiln-700 transition-all shadow-md shadow-kiln-200 active:scale-95"
          >
            Next Round →
          </button>
        )}
        <button
          onClick={onEndSession}
          className="px-6 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors"
        >
          End Session
        </button>
      </div>
    </div>
  )
}
