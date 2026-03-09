import { ResponsePanel } from './ResponsePanel'

interface PeerCritiqueViewProps {
  peerResponse: string
  peerName: string
  critiquePrompt: string
  serverTimestamp: string
  durationSec: number
  onSubmit: (content: string, timeTakenMs: number) => void
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
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-600 mb-2">
          {peerName}'s response:
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
