import { useState } from 'react'
import { Flame, ArrowRight, Loader2 } from 'lucide-react'

interface JoinSessionProps {
  onJoin: (code: string, name: string) => Promise<void>
  error?: string | null
  initialCode?: string
}

export function JoinSession({ onJoin, error, initialCode = '' }: JoinSessionProps) {
  const [code, setCode] = useState(initialCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6))
  const [name, setName] = useState('')
  const [joining, setJoining] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const normalizedCode = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)
    if (!normalizedCode || !name.trim()) return
    setJoining(true)
    try {
      await onJoin(normalizedCode, name.trim())
    } catch {
      // Parent handles user-facing errors; this prevents unhandled rejections.
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="p-3 bg-kiln-600 rounded-2xl shadow-sm">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Join Session</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="code" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Session Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6))}
              placeholder="ABCDEF"
              maxLength={6}
              className="w-full px-4 py-3.5 text-center text-2xl font-mono font-bold tracking-[0.3em] bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
              autoFocus={!initialCode}
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={50}
              autoFocus={!!initialCode}
              className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
          disabled={joining || code.replace(/[^a-zA-Z0-9]/g, '').length === 0 || !name.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-kiln-600 text-white font-semibold rounded-xl hover:bg-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join'}
            {!joining && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}
