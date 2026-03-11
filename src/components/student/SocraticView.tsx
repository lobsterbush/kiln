import { ResponsePanel } from './ResponsePanel'
import { Loader2, AlertCircle } from 'lucide-react'
import { FALLBACK_FOLLOW_UP_PROMPT } from '../../lib/constants'

interface SocraticViewProps {
  followUpPrompt: string | null
  previousResponse: string
  round: number
  serverTimestamp: string
  durationSec: number
  onSubmit: (content: string, timeTakenMs: number) => Promise<void>
  loading?: boolean
  timedOut?: boolean
}

export function SocraticView({
  followUpPrompt,
  previousResponse,
  round,
  serverTimestamp,
  durationSec,
  onSubmit,
  loading = false,
  timedOut = false,
}: SocraticViewProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 animate-fade-in">
        <div className="p-4 bg-kiln-50 rounded-2xl">
          <Loader2 className="w-8 h-8 text-kiln-500 animate-spin" />
        </div>
        <p className="text-sm text-slate-500 font-medium">Generating your follow-up question...</p>
      </div>
    )
  }

  // Timed out: use a generic fallback prompt so the student can still submit
  const effectivePrompt = followUpPrompt ?? (timedOut ? FALLBACK_FOLLOW_UP_PROMPT : null)

  if (!effectivePrompt) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 animate-fade-in">
        <div className="p-4 bg-kiln-50 rounded-2xl">
          <Loader2 className="w-8 h-8 text-kiln-500 animate-spin" />
        </div>
        <p className="text-sm text-slate-500 font-medium">Generating your follow-up question...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {timedOut && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Follow-up generation timed out — using a generic reflection prompt instead.</span>
        </div>
      )}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 rounded-2xl p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Your Round {round - 1} response
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">{previousResponse}</p>
      </div>

      <ResponsePanel
        prompt={effectivePrompt}
        serverTimestamp={serverTimestamp}
        durationSec={durationSec}
        onSubmit={onSubmit}
      />
    </div>
  )
}
