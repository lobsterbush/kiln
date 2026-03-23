import { useState } from 'react'
import { Users, Loader2, Copy, Check, Link as LinkIcon } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { Participant } from '../../lib/types'
import { copyToClipboard, KILN_ORIGIN } from '../../lib/utils'

interface SessionLobbyProps {
  joinCode: string
  participants: Participant[]
  isInstructor: boolean
  onStart?: (customPrompt?: string) => void
  initialPrompt?: string
  isStarting?: boolean
  activityTitle?: string
}

export function SessionLobby({ joinCode, participants, isInstructor, onStart, initialPrompt, isStarting = false, activityTitle }: SessionLobbyProps) {
  const [customPrompt, setCustomPrompt] = useState(initialPrompt ?? '')
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const joinUrl = `${KILN_ORIGIN}/join?code=${joinCode}`

  async function copyCode() {
    const ok = await copyToClipboard(joinCode)
    if (ok) {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  async function copyLink() {
    const ok = await copyToClipboard(joinUrl)
    if (ok) {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col items-center gap-10 py-16 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* QR code */}
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <QRCodeSVG value={joinUrl} size={140} fgColor="#0f172a" bgColor="#ffffff" />
          </div>
          <p className="text-xs text-slate-400">Scan to join</p>
        </div>

        {/* Code tiles */}
        <div className="text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">Session Code</p>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            {joinCode.split('').map((char, i) => (
              <span
                key={i}
                className="w-10 h-12 sm:w-14 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl font-mono font-bold text-slate-900 bg-white border-2 border-slate-200 rounded-xl shadow-sm"
              >
                {char}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-kiln-600 transition-colors"
            >
              {codeCopied
                ? <><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600">Copied!</span></>
                : <><Copy className="w-3.5 h-3.5" /> Copy code</>}
            </button>
            <span className="text-slate-200">|</span>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-kiln-600 transition-colors"
            >
              {linkCopied
                ? <><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600">Link copied!</span></>
                : <><LinkIcon className="w-3.5 h-3.5" /> Copy link</>}
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-2">Or go to <span className="font-mono text-slate-600">usekiln.org</span></p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-4 py-2 bg-kiln-50 rounded-full">
        <Users className="w-4 h-4 text-kiln-600" />
        <span className="text-sm font-semibold text-kiln-700">
          {participants.length} {participants.length === 1 ? 'student' : 'students'} joined
        </span>
      </div>

      <div className="w-full max-w-md">
        <div className="flex flex-wrap gap-2 justify-center stagger-children">
          {participants.map((p) => (
            <span
              key={p.id}
              className="px-3.5 py-1.5 bg-white rounded-full text-sm font-medium text-slate-700 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              {p.display_name}
            </span>
          ))}
        </div>
      </div>

      {isInstructor && (
        <>
          {initialPrompt !== undefined && (
            <div className="w-full max-w-lg flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Opening Prompt
                <span className="ml-2 normal-case font-normal">— edit to reference today’s discussion</span>
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors text-sm leading-relaxed h-24"
              />
            </div>
          )}
          <button
            onClick={() => onStart?.(customPrompt.trim() || undefined)}
            disabled={participants.length < 1 || isStarting}
            className="px-8 py-3.5 bg-kiln-600 text-white font-semibold rounded-xl hover:bg-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-lg hover:shadow-kiln-300 text-lg"
          >
            {isStarting ? 'Starting…' : 'Start Session'}
          </button>
        </>
      )}

      {!isInstructor && (
        <div className="flex flex-col items-center gap-3">
          {activityTitle && (
            <p className="text-base font-semibold text-slate-700">{activityTitle}</p>
          )}
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p className="text-sm">Waiting for instructor to start...</p>
          </div>
        </div>
      )}
    </div>
  )
}
