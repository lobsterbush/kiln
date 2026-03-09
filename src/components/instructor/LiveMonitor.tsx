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
  sessionStatus,
}: LiveMonitorProps) {
  const roundResponses = responses.filter((r) => r.round === currentRound)
  const submittedCount = roundResponses.length
  const totalCount = participants.length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Round {currentRound}</h2>
          <p className="text-sm text-slate-500">
            {submittedCount}/{totalCount} submitted
          </p>
        </div>

        {serverTimestamp && (
          <Timer
            serverTimestamp={serverTimestamp}
            durationSec={durationSec}
            className="w-48"
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${totalCount > 0 ? (submittedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* Response grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {participants.map((p) => {
          const response = roundResponses.find((r) => r.participant_id === p.id)
          return (
            <div
              key={p.id}
              className={cn(
                'rounded-lg border p-3 transition-all',
                response
                  ? 'bg-white border-emerald-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">{p.display_name}</span>
                {response ? (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    Submitted
                  </span>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    Writing...
                  </span>
                )}
              </div>
              {response && (
                <p className="text-sm text-slate-600 line-clamp-3">{response.content}</p>
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
            className="px-6 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            Next Round →
          </button>
        )}
        <button
          onClick={onEndSession}
          className="px-6 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
        >
          End Session
        </button>
      </div>
    </div>
  )
}
