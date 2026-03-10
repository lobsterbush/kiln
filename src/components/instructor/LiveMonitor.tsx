import { useState } from 'react'
import { Timer } from '../shared/Timer'
import type { Response, Participant } from '../../lib/types'
import { cn } from '../../lib/utils'

interface LiveMonitorProps {
  participants: Participant[]
  responses: Response[]
  currentRound: number
  roundPrompt?: string
  joinCode?: string
  serverTimestamp: string | null
  durationSec: number
  onAdvanceRound: () => void
  onEndSession: () => void
  onRoundExpire: () => void
  sessionStatus: string
  isAdvancing?: boolean
  peerWarning?: string | null
  onDismissPeerWarning?: () => void
}

export function LiveMonitor({
  participants,
  responses,
  currentRound,
  roundPrompt,
  joinCode,
  serverTimestamp,
  durationSec,
  onAdvanceRound,
  onEndSession,
  onRoundExpire,
  sessionStatus,
  isAdvancing = false,
  peerWarning,
  onDismissPeerWarning,
}: LiveMonitorProps) {
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const roundResponses = responses.filter((r) => r.round === currentRound)
  const submittedCount = roundResponses.length
  const totalCount = participants.length

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
      <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900">Round {currentRound}</h2>
            {joinCode && (
              <span className="font-mono text-xs font-bold tracking-widest text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                {joinCode}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            <span className="font-semibold text-kiln-600">{submittedCount}</span>/{totalCount} submitted
          </p>
          {roundPrompt && (
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm line-clamp-2 italic">{roundPrompt}</p>
          )}
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

      {/* Peer assignment warning */}
      {peerWarning && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <span className="flex-1">{peerWarning}</span>
          <button
            onClick={onDismissPeerWarning}
            className="text-amber-400 hover:text-amber-600 font-bold text-base leading-none"
            aria-label="Dismiss warning"
          >
            ×
          </button>
        </div>
      )}

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
      <div className="flex gap-3 justify-end items-center">
        {confirmingEnd ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">End session?</span>
            <button
              onClick={() => setConfirmingEnd(false)}
              className="px-4 py-2 text-sm bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { setConfirmingEnd(false); onEndSession() }}
              className="px-4 py-2 text-sm bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 transition-colors"
            >
              Yes, end
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingEnd(true)}
            disabled={isAdvancing}
            className="px-6 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            End Session
          </button>
        )}
        <button
          onClick={onAdvanceRound}
          disabled={isAdvancing}
          className={cn(
            'px-6 py-2.5 font-medium rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
            sessionStatus === 'between_rounds'
              ? 'bg-gradient-to-r from-kiln-500 to-kiln-600 text-white hover:from-kiln-600 hover:to-kiln-700 shadow-kiln-200'
              : 'bg-slate-200 text-slate-500 hover:bg-slate-300 shadow-slate-100'
          )}
        >
          {isAdvancing ? 'Working…' : sessionStatus === 'between_rounds' ? 'Next Round →' : 'Advance Early →'}
        </button>
      </div>
    </div>
  )
}
