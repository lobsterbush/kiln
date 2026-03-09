import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Flame, ArrowRight, BookOpen, Users, Clock } from 'lucide-react'

export function Home() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (code.trim()) {
      navigate(`/join?code=${code.trim().toUpperCase()}`)
    }
  }

  return (
    <div className="flex flex-col items-center gap-12 py-12">
      {/* Hero */}
      <div className="text-center max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Flame className="w-10 h-10 text-orange-500" />
          <h1 className="text-5xl font-bold text-slate-900">Kiln</h1>
        </div>
        <p className="text-xl text-slate-600">
          Real-time classroom activities where thinking happens live.
        </p>
      </div>

      {/* Join box */}
      <div className="w-full max-w-sm">
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter session code"
            maxLength={6}
            className="flex-1 px-4 py-3 text-center text-lg font-mono tracking-widest border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            type="submit"
            disabled={!code.trim()}
            className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        <div className="flex flex-col items-center text-center gap-2 p-4">
          <Clock className="w-8 h-8 text-orange-500" />
          <h3 className="font-semibold text-slate-800">Timed Responses</h3>
          <p className="text-sm text-slate-500">
            30–90 second windows that keep thinking sharp and focused.
          </p>
        </div>
        <div className="flex flex-col items-center text-center gap-2 p-4">
          <Users className="w-8 h-8 text-orange-500" />
          <h3 className="font-semibold text-slate-800">Peer Critique</h3>
          <p className="text-sm text-slate-500">
            Structured rounds of argument, critique, and rebuttal.
          </p>
        </div>
        <div className="flex flex-col items-center text-center gap-2 p-4">
          <BookOpen className="w-8 h-8 text-orange-500" />
          <h3 className="font-semibold text-slate-800">Socratic Chains</h3>
          <p className="text-sm text-slate-500">
            Adaptive follow-up questions that probe your reasoning.
          </p>
        </div>
      </div>

      {/* Instructor link */}
      <div className="text-center">
        <Link
          to="/instructor"
          className="text-sm text-slate-500 hover:text-orange-600 transition-colors"
        >
          I'm an instructor →
        </Link>
      </div>
    </div>
  )
}
