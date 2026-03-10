import { ResponsePanel } from './ResponsePanel'

interface PeerCritiqueViewProps {
  peerResponse: string
  peerName: string
  critiquePrompt: string
  serverTimestamp: string
  durationSec: number
  onSubmit: (content: string, timeTakenMs: number) => Promise<void>
}

export function PeerCritiqueView({
  peerResponse,
  peerName,
  critiquePrompt,
  serverTimestamp,
  durationSec,
  onSubmit,
}: PeerCritiqueViewProps) {
  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl p-5">
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">
          {peerName}'s response
        </p>
        <p className="text-slate-800 leading-relaxed">{peerResponse}</p>
      </div>

      <ResponsePanel
        prompt={critiquePrompt}
        serverTimestamp={serverTimestamp}
        durationSec={durationSec}
        onSubmit={onSubmit}
      />
    </div>
  )
}
