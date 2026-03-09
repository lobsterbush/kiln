import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Flame, ArrowRight, BookOpen, Users, Clock, Zap, BarChart3, Check, Mail } from 'lucide-react'

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
            Real-time activities that make every student think, write, and argue —
            while you watch it happen live.
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
            <h3 className="font-semibold text-slate-800">Structured Rounds</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Short timed windows keep every student writing — not waiting for someone else to speak.
            </p>
          </div>
          <div className="group flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-kiln-200 transition-all duration-300">
            <div className="p-2.5 bg-kiln-50 rounded-xl group-hover:bg-kiln-100 transition-colors">
              <Users className="w-6 h-6 text-kiln-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Peer Critique</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Every student writes, critiques a peer's argument, and defends their own — no passengers.
            </p>
          </div>
          <div className="group flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-kiln-200 transition-all duration-300">
            <div className="p-2.5 bg-kiln-50 rounded-xl group-hover:bg-kiln-100 transition-colors">
              <BookOpen className="w-6 h-6 text-kiln-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Socratic Chains</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              AI generates a personalized follow-up that probes the weakest point in each student's specific reasoning.
            </p>
          </div>
        </div>
      </div>

      {/* Why Kiln strip */}
      <div className="w-full bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Why instructors use Kiln
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center gap-2">
              <BarChart3 className="w-6 h-6 text-kiln-400" />
              <h3 className="font-semibold text-white">See every student think</h3>
              <p className="text-sm text-slate-400">
                Watch responses appear in real time. Know who's engaged and who needs support before class ends.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <Users className="w-6 h-6 text-kiln-400" />
              <h3 className="font-semibold text-white">Everyone participates</h3>
              <p className="text-sm text-slate-400">
                No more three students dominating. Structured rounds ensure every voice is heard.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <Zap className="w-6 h-6 text-kiln-400" />
              <h3 className="font-semibold text-white">Up in under a minute</h3>
              <p className="text-sm text-slate-400">
                Students join with a 6-character code — no accounts, no downloads, no friction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="w-full max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Simple pricing</h2>
        <p className="text-slate-500 text-center mb-10">Free to try. No credit card required.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free tier */}
          <div className="flex flex-col p-8 bg-white rounded-2xl border-2 border-kiln-300 shadow-sm">
            <div className="mb-4">
              <span className="inline-block text-xs font-bold text-kiln-600 bg-kiln-50 px-3 py-1 rounded-full uppercase tracking-wider">Free beta</span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900">$0</span>
              <span className="text-slate-500 ml-1">/ semester</span>
            </div>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {[
                'Unlimited activities',
                'Up to 50 students per session',
                'Peer Critique & Socratic Chain',
                'Live monitor dashboard',
                'Session history',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-kiln-500 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/instructor"
              className="block text-center px-5 py-3 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white font-semibold rounded-xl hover:from-kiln-600 hover:to-kiln-700 transition-all shadow-md shadow-kiln-200 active:scale-95"
            >
              Get started free
            </Link>
          </div>

          {/* Institution tier */}
          <div className="flex flex-col p-8 bg-slate-50 rounded-2xl border-2 border-slate-200">
            <div className="mb-4">
              <span className="inline-block text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">Institution</span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-400">—</span>
              <span className="inline-block ml-3 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">Coming soon</span>
            </div>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {[
                'Everything in Free',
                'Canvas & Moodle LMS integration',
                'Advanced analytics & exports',
                'SSO / institutional login',
                'Priority support',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-500">
                  <Check className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="mailto:charles.crabtree@monash.edu?subject=Kiln%20Institution%20Waitlist"
              className="flex items-center justify-center gap-2 w-full text-center px-5 py-3 bg-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-300 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Join waitlist
            </a>
          </div>
        </div>
      </div>

      {/* Instructor CTA */}
      <div className="w-full py-16 text-center border-t border-slate-100">
        <p className="text-slate-500 mb-4">Start your first activity in under a minute.</p>
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
