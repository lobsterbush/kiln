import { Users } from 'lucide-react'
import type { Participant } from '../../lib/types'

interface SessionLobbyProps {
  joinCode: string
  participants: Participant[]
  isInstructor: boolean
  onStart?: () => void
}

export function SessionLobby({ joinCode, participants, isInstructor, onStart }: SessionLobbyProps) {
  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="text-center">
        <p className="text-sm text-slate-500 uppercase tracking-wide mb-2">Join Code</p>
        <p className="text-5xl font-mono font-bold tracking-widest text-slate-900">
          {joinCode}
        </p>
      </div>

      <div className="flex items-center gap-2 text-slate-600">
        <Users className="w-5 h-5" />
        <span className="text-lg">
          {participants.length} {participants.length === 1 ? 'student' : 'students'} joined
        </span>
      </div>

      <div className="w-full max-w-sm">
        <div className="flex flex-wrap gap-2 justify-center">
          {participants.map((p) => (
            <span
              key={p.id}
              className="px-3 py-1 bg-white rounded-full text-sm text-slate-700 border border-slate-200 shadow-sm"
            >
              {p.display_name}
            </span>
          ))}
        </div>
      </div>

      {isInstructor && (
        <button
          onClick={onStart}
          disabled={participants.length < 2}
          className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
        >
          Start Session
        </button>
      )}

      {!isInstructor && (
        <p className="text-slate-500 animate-pulse">Waiting for instructor to start...</p>
      )}
    </div>
  )
}
