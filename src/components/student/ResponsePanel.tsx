import { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { Timer } from '../shared/Timer'
import { MediaDisplay } from '../shared/MediaDisplay'
import { cn } from '../../lib/utils'
import type { MediaType } from '../../lib/types'

interface ResponsePanelProps {
  prompt: string
  serverTimestamp: string
  durationSec: number
  onSubmit: (content: string, timeTakenMs: number) => Promise<void>
  disabled?: boolean
  mediaUrl?: string
  mediaType?: MediaType
}

export function ResponsePanel({
  prompt,
  serverTimestamp,
  durationSec,
  onSubmit,
  disabled = false,
  mediaUrl,
  mediaType,
}: ResponsePanelProps) {
  const [content, setContent] = useState('')
  const [locked, setLocked] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const startTime = useRef(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resetPanel = useCallback(() => {
    startTime.current = Date.now()
    setContent('')
    setLocked(false)
    setSubmitted(false)
    setSubmitting(false)
    setSubmitError(null)
  }, [])

  useEffect(() => {
    resetPanel()
    textareaRef.current?.focus()
  }, [prompt, serverTimestamp, resetPanel])

  function handleExpire() {
    setLocked(true)
    if (content.trim() && !submitted && !submitting) {
      void handleSubmit()
    }
  }

  async function handleSubmit() {
    if (!content.trim() || submitted || submitting) return
    const timeTakenMs = Date.now() - startTime.current
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(content.trim(), timeTakenMs)
      setSubmitted(true)
    } catch {
      setSubmitting(false)
      setSubmitError('Could not save your response. Please try again.')
    }
  }

  const isDisabled = disabled || locked || submitted || submitting

  return (
    <div className="flex flex-col gap-4">
      <Timer
        serverTimestamp={serverTimestamp}
        durationSec={durationSec}
        onExpire={handleExpire}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm animate-slide-up overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 bg-slate-50/60 flex flex-col gap-3">
          {mediaUrl && mediaType && <MediaDisplay url={mediaUrl} type={mediaType} />}
          <p className="text-base sm:text-lg font-semibold text-slate-800 leading-snug">{prompt}</p>
        </div>

        <div className="p-5">
        {locked && !submitted ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center animate-fade-in">
            <p className="font-semibold text-slate-700">Time's up</p>
            <p className="text-sm text-slate-400 animate-pulse">Waiting for the next round...</p>
          </div>
        ) : (
          <>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isDisabled}
              placeholder="Type your response..."
              aria-label="Your response"
              className={cn(
                'w-full h-52 sm:h-44 p-4 border-2 rounded-xl resize-none text-base leading-relaxed transition-all focus:outline-none',
                isDisabled
                  ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                  : 'bg-white text-slate-900 border-slate-200 focus:border-kiln-400'
              )}
            />

            {submitError && (
              <p role="alert" className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{submitError}</p>
            )}
            <div className="flex items-center justify-between mt-4">
              {(() => {
                const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
                const isThin = wordCount > 0 && wordCount < 15
                return (
                  <span className={`text-xs font-medium tabular-nums ${isThin ? 'text-amber-500' : 'text-slate-400'}`}>
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                    {isThin && <span className="ml-1 font-normal">— aim for 15+</span>}
                  </span>
                )
              })()}
              <button
                onClick={handleSubmit}
                disabled={isDisabled || !content.trim()}
                className={cn(
                  'flex items-center gap-2 px-6 py-2.5 font-semibold rounded-xl transition-all',
                  submitted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-kiln-500 hover:bg-kiln-600 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none'
                )}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitted ? '✓ Submitted' : submitting ? 'Saving…' : 'Submit'}
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  )
}
