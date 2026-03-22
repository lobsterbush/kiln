import { useState } from 'react'
import { Timer } from '../shared/Timer'
import { Monitor, X, Cast, Check } from 'lucide-react'
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
  sessionId?: string
  onFeatureResponse?: (responseId: string, participantName: string, content: string) => void
}

interface ExpandedResponse {
  responseId: string
  name: string
  content: string
  timeTakenMs: number | null
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
  sessionId,
  onFeatureResponse,
}: LiveMonitorProps) {
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const [expanded, setExpanded] = useState<ExpandedResponse | null>(null)
  const [projectorSent, setProjectorSent] = useState<string | null>(null) // response id last sent
  const roundResponses = responses.filter((r) => r.round === currentRound)
  const submittedCount = roundResponses.length
  const totalCount = participants.length

  return (
    <>
    {/* Full-text response overlay */}
    {expanded && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={() => setExpanded(null)}
      >
        <div
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">{expanded.name}</h3>
            <button
              onClick={() => setExpanded(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{expanded.content}</p>
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {expanded.content.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            {expanded.timeTakenMs != null && (
              <span className="text-xs text-slate-400">
                {(expanded.timeTakenMs / 1000).toFixed(1)}s to submit
              </span>
            )}
            {onFeatureResponse && expanded.responseId && (
              <button
                onClick={() => {
                  onFeatureResponse(expanded.responseId!, expanded.name, expanded.content)
                  setProjectorSent(expanded.responseId!)
                  setTimeout(() => setProjectorSent(null), 2500)
                }}
                className={cn(
                  'ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  projectorSent === expanded.responseId
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {projectorSent === expanded.responseId
                  ? <><Check className="w-3 h-3" /> Sent to projector</>
                  : <><Cast className="w-3 h-3" /> Show on projector</>}
              </button>
            )}
          </div>
        </div>
      </div>
    )}
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
            {sessionStatus === 'between_rounds' && (
              <span className="text-xs font-bold bg-cyan-100 text-cyan-700 px-2.5 py-1 rounded-lg animate-pulse">
                ⏸ Paused
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
        <div className="flex items-center gap-3 px-4 py-3 bg-cyan-50 border border-cyan-200 rounded-xl text-sm text-amber-800">
          <span className="flex-1">{peerWarning}</span>
          <button
            onClick={onDismissPeerWarning}
            className="text-amber-400 hover:text-cyan-600 font-bold text-base leading-none"
            aria-label="Dismiss warning"
          >
            ×
          </button>
        </div>
      )}

      {/* Response grid — click any submitted card to read full text */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
        {participants.map((p) => {
          const response = roundResponses.find((r) => r.participant_id === p.id)
          return (
            <div
              key={p.id}
              onClick={() => response && setExpanded({ responseId: response.id, name: p.display_name, content: response.content, timeTakenMs: response.time_taken_ms })}
              className={cn(
                'rounded-2xl border p-4 transition-all duration-200',
                response
                  ? 'bg-white border-emerald-200 shadow-sm cursor-pointer hover:border-emerald-300 hover:shadow-md'
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
                <>
                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{response.content}</p>
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                    <span>{response.content.trim().split(/\s+/).filter(Boolean).length} words</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-kiln-500 font-medium">Click to read</span>
                  </p>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-end items-center flex-wrap">
        {sessionId && (
          <a
            href={`${window.location.origin}${import.meta.env.BASE_URL}instructor/session/${sessionId}/display`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Monitor className="w-4 h-4" /> Projector View
          </a>
        )}
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
    </>
  )
}
