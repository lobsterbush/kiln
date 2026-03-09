import { useState, useRef, useEffect } from 'react'
import { Timer } from '../shared/Timer'
import { cn } from '../../lib/utils'

interface ResponsePanelProps {
  prompt: string
  serverTimestamp: string
  durationSec: number
  onSubmit: (content: string, timeTakenMs: number) => void
  disabled?: boolean
}

export function ResponsePanel({
  prompt,
  serverTimestamp,
  durationSec,
  onSubmit,
  disabled = false,
}: ResponsePanelProps) {
  const [content, setContent] = useState('')
  const [locked, setLocked] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const startTime = useRef(Date.now())
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    startTime.current = Date.now()
    setContent('')
    setLocked(false)
    setSubmitted(false)
    textareaRef.current?.focus()
  }, [prompt, serverTimestamp])

  function handleExpire() {
    setLocked(true)
    if (content.trim() && !submitted) {
      handleSubmit()
    }
  }

  function handleSubmit() {
    if (!content.trim() || submitted) return
    const timeTakenMs = Date.now() - startTime.current
    setSubmitted(true)
    onSubmit(content.trim(), timeTakenMs)
  }

  const isDisabled = disabled || locked || submitted

  return (
    <div className="flex flex-col gap-4">
      <Timer
        serverTimestamp={serverTimestamp}
        durationSec={durationSec}
        onExpire={handleExpire}
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-slide-up">
        <p className="text-lg font-semibold text-slate-800 mb-4 leading-relaxed">{prompt}</p>

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
              className={cn(
                'w-full h-44 p-4 border-2 rounded-xl resize-none text-base leading-relaxed transition-all focus:outline-none',
                isDisabled
                  ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                  : 'bg-white text-slate-900 border-slate-200 focus:border-kiln-400'
              )}
            />

            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-slate-400 font-medium">
                {content.length} characters
              </span>
              <button
                onClick={handleSubmit}
                disabled={isDisabled || !content.trim()}
                className={cn(
                  'px-6 py-2.5 font-semibold rounded-xl transition-all active:scale-95',
                  submitted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gradient-to-r from-kiln-500 to-kiln-600 text-white hover:from-kiln-600 hover:to-kiln-700 shadow-md shadow-kiln-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none'
                )}
              >
                {submitted ? '✓ Submitted' : 'Submit'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
