import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Users, BookOpen, Check, Mail } from 'lucide-react'

// ─── Fake live-session mockup shown in the hero ───────────────────────────────
function LivePreview() {
  const students = [
    { name: 'Priya K.',  submitted: true,  text: 'Electoral institutions create incentives that…' },
    { name: 'Marcus T.', submitted: true,  text: 'The key factor is the breakdown of party…' },
    { name: 'Sofia L.',  submitted: false },
    { name: 'James W.',  submitted: true,  text: 'Without strong civil society, formal…' },
    { name: 'Aisha M.',  submitted: false },
    { name: 'Dev R.',    submitted: true,  text: 'Economic inequality amplifies political…' },
  ]
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/60 p-5 select-none">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800">Round 1 of 3</span>
            <span className="font-mono text-xs font-bold tracking-widest text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">XK7R4P</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5"><span className="font-semibold text-kiln-600">4</span>/6 submitted</p>
          <p className="text-xs text-slate-400 mt-0.5 italic line-clamp-1">What explains democratic backsliding in Hungary?</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-mono font-bold text-emerald-600 tabular-nums leading-none">1:24</p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">remaining</p>
        </div>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-kiln-400 to-kiln-500 rounded-full" style={{ width: '67%' }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {students.map((s) => (
          <div key={s.name} className={`rounded-xl border p-3 ${s.submitted ? 'bg-white border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-700">{s.name}</span>
              {s.submitted
                ? <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">✓ Submitted</span>
                : <span className="text-xs bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full animate-pulse">Writing…</span>
              }
            </div>
            {s.submitted && s.text && (
              <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">{s.text}</p>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        <div className="px-4 py-2 bg-slate-100 text-slate-400 text-xs font-medium rounded-xl">End Session</div>
        <div className="px-4 py-2 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white text-xs font-semibold rounded-xl shadow-sm">Advance Early →</div>
      </div>
    </div>
  )
}

export function Home() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (code.trim()) navigate(`/join?code=${code.trim().toUpperCase()}`)
  }

  return (
    <div className="flex flex-col">

      {/* ═══ HERO: full viewport, two-column ═══ */}
      <section id="hero" className="w-full bg-kiln-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20 lg:py-0 flex flex-col lg:flex-row lg:items-center gap-14 lg:gap-16 lg:min-h-[calc(100vh-3.5rem)]">

          {/* Left: copy + CTAs */}
          <div className="flex-1 flex flex-col gap-8 animate-fade-in lg:py-20">
            <div>
              <span className="inline-block text-xs font-bold text-kiln-700 bg-kiln-100 border border-kiln-200 px-3 py-1.5 rounded-full uppercase tracking-wider mb-6">
                AI-resistant active learning
              </span>
              <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-5">
                AI can write the essay.<br />
                <span className="text-kiln-500">It can't think live.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-lg">
                Real-time, timed activities where students must argue, critique, and
                defend their reasoning on the spot — no copy-pasting possible.
              </p>
            </div>

            {/* Two-card CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              {/* Student */}
              <div className="flex flex-col gap-3 p-5 bg-white rounded-2xl border-2 border-kiln-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">I’m a student</p>
                <form onSubmit={handleJoin} className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="flex-1 px-3 py-2.5 text-center text-lg font-mono font-bold tracking-[0.25em] bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors placeholder:text-slate-300 placeholder:tracking-[0.1em] placeholder:font-normal"
                  />
                  <button
                    type="submit"
                    disabled={!code.trim()}
                    className="px-4 py-2.5 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white rounded-xl hover:from-kiln-600 hover:to-kiln-700 disabled:opacity-40 transition-all shadow-md shadow-kiln-200 active:scale-95"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
                <p className="text-xs text-slate-400">Enter the code from your instructor</p>
              </div>

              {/* Instructor */}
              <div className="flex flex-col gap-3 p-5 bg-gradient-to-br from-kiln-500 to-kiln-600 rounded-2xl text-white shadow-lg shadow-kiln-200">
                <p className="text-xs font-bold text-kiln-100 uppercase tracking-wider">I’m an instructor</p>
                <Link
                  to="/instructor"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-kiln-700 font-bold rounded-xl hover:bg-kiln-50 transition-colors shadow-sm"
                >
                  Get started free <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-xs text-kiln-100">No credit card. Up in 60 seconds.</p>
              </div>
            </div>
          </div>

          {/* Right: live monitor mockup — hidden on small screens, shown below on md */}
          <div className="hidden lg:flex flex-1 flex-col w-full max-w-lg animate-slide-up py-20">
            <p className="text-xs font-bold text-kiln-600 uppercase tracking-wider text-center mb-3">
              What you see as the instructor
            </p>
            <LivePreview />
          </div>
        </div>

        {/* Mobile: show mockup below CTAs */}
        <div className="lg:hidden max-w-lg mx-auto px-6 pb-16">
          <p className="text-xs font-bold text-kiln-600 uppercase tracking-wider text-center mb-3">
            What you see as the instructor
          </p>
          <LivePreview />
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="w-full bg-slate-900 py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Up and running in 60 seconds</h2>
            <p className="text-slate-400">No student accounts. No downloads. Nothing to install.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Create an activity', body: 'Pick Peer Critique or Socratic Chain, write a prompt, set a timer. Templates included.', note: 'Takes under a minute.' },
              { step: '02', title: 'Students join with a code', body: 'Share a 6-character code. Students open it on any phone, tablet, or laptop — no account needed.', note: 'Works on any device.' },
              { step: '03', title: 'Watch it happen live', body: 'Responses appear in real time. See who submitted and what they wrote before the class ends.', note: 'Export CSV when done.' },
            ].map((s) => (
              <div key={s.step} className="flex flex-col gap-4">
                <span className="text-6xl font-extrabold text-kiln-600/30 leading-none">{s.step}</span>
                <h3 className="text-lg font-bold text-white">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.body}</p>
                <p className="text-xs text-kiln-500 font-semibold">{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHAT YOU'RE SIGNING UP FOR ═══ */}
      <section id="features" className="w-full py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Two activity types. Zero passengers.</h2>
            <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
              Every student produces original writing every round. No copy-pasting. No waiting.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Peer Critique */}
            <div className="flex flex-col bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
              <div className="p-6 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-kiln-50 rounded-xl"><Users className="w-5 h-5 text-kiln-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Peer Critique</h3>
                    <p className="text-xs text-slate-400 font-medium">2 or 3 rounds</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Students write a claim, critique a peer’s argument, then defend their own position under fire — every student as both author and critic.
                </p>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 flex-1">
                {[
                  { round: 1, label: 'Make your case',     emoji: '✍️', text: 'Everyone responds to the opening prompt with an original argument. Timed.' },
                  { round: 2, label: 'Find the weakness',  emoji: '🔍', text: 'Each student is assigned a peer’s argument at random and must identify its weakest assumption.' },
                  { round: 3, label: 'Defend your position', emoji: '⚔️', text: 'Students receive the critique of their own work and write a rebuttal. No hiding.' },
                ].map((r) => (
                  <div key={r.round} className="flex items-start gap-4 p-5">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">{r.round}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">{r.emoji} {r.label}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Socratic Chain */}
            <div className="flex flex-col bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
              <div className="p-6 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-kiln-50 rounded-xl"><BookOpen className="w-5 h-5 text-kiln-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Socratic Chain</h3>
                    <p className="text-xs text-slate-400 font-medium">2–5 rounds</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  AI reads each student’s specific response and generates a personalised follow-up that targets the gap in <em>their</em> reasoning — different for every student.
                </p>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 flex-1">
                {[
                  { round: 1, label: 'Initial response',        emoji: '✍️', text: 'Everyone answers the opening question in their own words.' },
                  { round: 2, label: 'Personalised AI follow-up', emoji: '🤖', text: 'Claude reads each student’s specific answer and generates a follow-up that probes the weakest point in their reasoning. Every student gets a different question.' },
                  { round: 3, label: 'Deepen the argument',     emoji: '💡', text: 'Students respond to their personal challenge. Each one confronts exactly what their argument left unanswered.' },
                ].map((r) => (
                  <div key={r.round} className="flex items-start gap-4 p-5">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">{r.round}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">{r.emoji} {r.label}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="w-full py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-2">Simple pricing</h2>
          <p className="text-slate-500 text-center mb-12">Free while in beta. No credit card needed.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col p-8 bg-white rounded-2xl border-2 border-kiln-300 shadow-sm">
              <span className="inline-block text-xs font-bold text-kiln-600 bg-kiln-50 px-3 py-1 rounded-full uppercase tracking-wider mb-4 w-fit">Free beta</span>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
                <span className="text-slate-500 ml-1">/ semester</span>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {['Unlimited activities', 'Large class support', 'Peer Critique & Socratic Chain', 'Live monitor dashboard', 'Session history & CSV export'].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-kiln-500 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link to="/instructor" className="block text-center px-5 py-3 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white font-semibold rounded-xl hover:from-kiln-600 hover:to-kiln-700 transition-all shadow-md shadow-kiln-200 active:scale-95">
                Get started free
              </Link>
            </div>
            <div className="flex flex-col p-8 bg-slate-50 rounded-2xl border-2 border-slate-200">
              <span className="inline-block text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full uppercase tracking-wider mb-4 w-fit">Institution</span>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-400">—</span>
                <span className="inline-block ml-3 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">Coming soon</span>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {['Everything in Free', 'Canvas & Moodle LMS integration', 'Advanced analytics & exports', 'SSO / institutional login', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-500">
                    <Check className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <a href="mailto:charles.crabtree@monash.edu?subject=Kiln%20Institution%20Waitlist" className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-300 transition-colors">
                <Mail className="w-4 h-4" />Join waitlist
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
