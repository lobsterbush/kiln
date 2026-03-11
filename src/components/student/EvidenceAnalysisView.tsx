import { ResponsePanel } from './ResponsePanel'

interface EvidenceAnalysisViewProps {
  peerResponse: string
  peerName: string
  gapPrompt: string
  serverTimestamp: string
  durationSec: number
  onSubmit: (content: string, timeTakenMs: number) => Promise<void>
}

export function EvidenceAnalysisView({
  peerResponse,
  peerName,
  gapPrompt,
  serverTimestamp,
  durationSec,
  onSubmit,
}: EvidenceAnalysisViewProps) {
  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200/60 rounded-2xl p-5">
        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
          {peerName}'s interpretation
        </p>
        <p className="text-xs text-amber-500 mb-3">
          Where does this argument make an inferential leap it hasn't justified?
        </p>
        <p className="text-slate-800 leading-relaxed">{peerResponse}</p>
      </div>

      <ResponsePanel
        prompt={gapPrompt}
        serverTimestamp={serverTimestamp}
        durationSec={durationSec}
        onSubmit={onSubmit}
      />
    </div>
  )
}
