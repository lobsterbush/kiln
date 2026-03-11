import { ResponsePanel } from './ResponsePanel'

interface PeerClarificationViewProps {
  peerResponse: string
  peerName: string
  explainPrompt: string
  serverTimestamp: string
  durationSec: number
  onSubmit: (content: string, timeTakenMs: number) => Promise<void>
}

export function PeerClarificationView({
  peerResponse,
  peerName,
  explainPrompt,
  serverTimestamp,
  durationSec,
  onSubmit,
}: PeerClarificationViewProps) {
  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/60 rounded-2xl p-5">
        <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
          {peerName}'s confusion
        </p>
        <p className="text-xs text-teal-500 mb-3">
          Explain this to them in plain language — no jargon, no hedging.
        </p>
        <p className="text-slate-800 leading-relaxed">{peerResponse}</p>
      </div>

      <ResponsePanel
        prompt={explainPrompt}
        serverTimestamp={serverTimestamp}
        durationSec={durationSec}
        onSubmit={onSubmit}
      />
    </div>
  )
}
