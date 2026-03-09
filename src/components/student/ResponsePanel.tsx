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

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <p className="text-lg font-medium text-slate-800 mb-4">{prompt}</p>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isDisabled}
          placeholder="Type your response..."
          className={cn(
            'w-full h-40 p-3 border rounded-lg resize-none text-base transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300',
            isDisabled
              ? 'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed'
              : 'bg-white text-slate-900 border-slate-300'
          )}
        />

        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-slate-400">
            {content.length} characters
          </span>
          <button
            onClick={handleSubmit}
            disabled={isDisabled || !content.trim()}
            className="px-6 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitted ? 'Submitted ✓' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
