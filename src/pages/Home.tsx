import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Flame, ArrowRight, BookOpen, Users, Clock, Zap, Shield, BarChart3 } from 'lucide-react'

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
    <div className="flex flex-col items-center">
      {/* Hero */}
      <div className="w-full bg-gradient-to-b from-kiln-50 via-white to-white -mt-8 pt-20 pb-16">
        <div className="max-w-2xl mx-auto text-center animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-kiln-400 to-kiln-600 rounded-2xl shadow-lg shadow-kiln-200">
              <Flame className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-4">
            Where thinking
            <span className="bg-gradient-to-r from-kiln-500 to-kiln-700 bg-clip-text text-transparent"> hardens</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 max-w-lg mx-auto leading-relaxed">
            Real-time classroom activities that make AI irrelevant.
            Timed. Structured. Human.
          </p>
        </div>

        {/* Join box */}
        <div className="w-full max-w-sm mx-auto mt-10 animate-slide-up">
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SESSION CODE"
              maxLength={6}
              className="flex-1 px-4 py-3.5 text-center text-lg font-mono font-bold tracking-[0.3em] bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors placeholder:text-slate-300 placeholder:tracking-[0.2em] placeholder:font-normal"
            />
            <button
              type="submit"
              disabled={!code.trim()}
              className="px-5 py-3.5 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white rounded-xl hover:from-kiln-600 hover:to-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-kiln-200 hover:shadow-lg hover:shadow-kiln-300 active:scale-95"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-3">
            Enter the 6-character code from your instructor
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="w-full max-w-4xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
          <div className="group flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-kiln-200 transition-all duration-300">
            <div className="p-2.5 bg-kiln-50 rounded-xl group-hover:bg-kiln-100 transition-colors">
              <Clock className="w-6 h-6 text-kiln-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Timed Responses</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              30–90 second windows that keep thinking sharp and focused.
            </p>
          </div>
          <div className="group flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-kiln-200 transition-all duration-300">
            <div className="p-2.5 bg-kiln-50 rounded-xl group-hover:bg-kiln-100 transition-colors">
              <Users className="w-6 h-6 text-kiln-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Peer Critique</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Structured rounds of argument, critique, and rebuttal.
            </p>
          </div>
          <div className="group flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-kiln-200 transition-all duration-300">
            <div className="p-2.5 bg-kiln-50 rounded-xl group-hover:bg-kiln-100 transition-colors">
              <BookOpen className="w-6 h-6 text-kiln-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Socratic Chains</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Adaptive follow-ups that probe your reasoning in real time.
            </p>
          </div>
        </div>
      </div>

      {/* Why Kiln strip */}
      <div className="w-full bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Built for the AI era
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center gap-2">
              <Zap className="w-6 h-6 text-kiln-400" />
              <h3 className="font-semibold text-white">Too fast for ChatGPT</h3>
              <p className="text-sm text-slate-400">
                Timed prompts close before AI tools can help.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <Shield className="w-6 h-6 text-kiln-400" />
              <h3 className="font-semibold text-white">No false accusations</h3>
              <p className="text-sm text-slate-400">
                Design out cheating instead of detecting it.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <BarChart3 className="w-6 h-6 text-kiln-400" />
              <h3 className="font-semibold text-white">See thinking live</h3>
              <p className="text-sm text-slate-400">
                Watch every student's reasoning unfold in real time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructor CTA */}
      <div className="w-full py-16 text-center">
        <p className="text-slate-500 mb-4">Ready to run your first activity?</p>
        <Link
          to="/instructor"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:border-kiln-400 hover:text-kiln-600 transition-all duration-200"
        >
          Instructor Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
