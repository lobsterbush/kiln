import { ResponsePanel } from './ResponsePanel'
import { Loader2 } from 'lucide-react'

interface SocraticViewProps {
  followUpPrompt: string | null
  previousResponse: string
  round: number
  serverTimestamp: string
  durationSec: number
  onSubmit: (content: string, timeTakenMs: number) => void
  loading?: boolean
}

export function SocraticView({
  followUpPrompt,
  previousResponse,
  round,
  serverTimestamp,
  durationSec,
  onSubmit,
  loading = false,
}: SocraticViewProps) {
  if (loading || !followUpPrompt) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-slate-500">Generating your follow-up question...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4">
        <p className="text-xs font-medium text-slate-500 mb-1">
          Your Round {round - 1} response:
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">{previousResponse}</p>
      </div>

      <ResponsePanel
        prompt={followUpPrompt}
        serverTimestamp={serverTimestamp}
        durationSec={durationSec}
        onSubmit={onSubmit}
      />
    </div>
  )
}
