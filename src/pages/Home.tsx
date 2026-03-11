import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Users, BookOpen, HelpCircle, BarChart2, Check, Mail } from 'lucide-react'
import { useAuth } from '../lib/auth'

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
  const { user, loading } = useAuth()

  // Instructor confirmed email or clicked magic link — Supabase lands them here;
  // forward immediately to the dashboard. Wait for auth to resolve first.
  useEffect(() => {
    if (!loading && user) navigate('/instructor', { replace: true })
  }, [user, loading, navigate])

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
                Live formative assessment
              </span>
              <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-5">
                Active learning you<br />
                <span className="text-kiln-500">can see and verify.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-lg">
                Timed, reactive in-class activities where every student responds
                to content unique to them — live, on the spot, while you watch.
                Genuine thinking, not pre-generated answers.
              </p>
            </div>

            {/* Student join — primary action */}
            <div className="flex flex-col gap-3 max-w-lg">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student? Enter your session code</p>
              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="flex-1 px-5 py-4 text-center text-2xl font-mono font-bold tracking-[0.3em] bg-white border-2 border-slate-300 rounded-2xl focus:outline-none focus:border-kiln-400 transition-colors shadow-sm placeholder:text-slate-200 placeholder:tracking-[0.15em] placeholder:font-normal"
                />
                <button
                  type="submit"
                  disabled={!code.trim()}
                  className="px-5 py-4 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white rounded-2xl hover:from-kiln-600 hover:to-kiln-700 disabled:opacity-40 transition-all shadow-md shadow-kiln-200 active:scale-95"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </form>
              <div className="flex items-center justify-between pt-1">
                <p className="text-sm text-slate-400">Code is on the board or screen.</p>
                <Link
                  to="/instructor"
                  className="flex items-center gap-1.5 text-sm font-semibold text-kiln-600 hover:text-kiln-700 transition-colors"
                >
                  Instructor? Get started free <ArrowRight className="w-3.5 h-3.5" />
                </Link>
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
{ step: '01', title: 'Create an activity', body: 'Pick one of four activity types, write a prompt, set a timer. Templates included.', note: 'Takes under a minute.' },
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
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Four activity types. Zero passengers.</h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              Every student produces original writing every round. No copy-pasting. No pre-generation.
              Each type was designed to make honest thinking the path of least resistance.
            </p>
            <Link
              to="/pedagogy"
              className="inline-flex items-center gap-1.5 text-sm text-kiln-600 hover:text-kiln-700 font-medium mt-4 transition-colors"
            >
              Read the evidence base <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Peer Critique */}
            <div className="flex flex-col bg-white rounded-2xl border-2 border-blue-100 overflow-hidden">
              <div className="p-6 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-50 rounded-xl"><Users className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Peer Critique</h3>
                    <p className="text-xs text-blue-500 font-medium">2 or 3 rounds</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Students write a claim, critique a peer's argument, then defend their own position under fire — every student as both author and critic.
                </p>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 flex-1">
                {[
                  { round: 1, label: 'Make your case',     emoji: '✍️', text: 'Everyone responds to the opening prompt with an original argument. Timed.' },
                  { round: 2, label: 'Find the weakness',  emoji: '🔍', text: 'Each student is assigned a peer\'s argument at random and must identify its weakest assumption.' },
                  { round: 3, label: 'Defend your position', emoji: '⚔️', text: 'Students receive the critique of their own work and write a rebuttal. No hiding.' },
                ].map((r) => (
                  <div key={r.round} className="flex items-start gap-4 p-5">
                    <span className="text-xs font-mono font-bold text-blue-400 bg-blue-50 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">{r.round}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">{r.emoji} {r.label}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Socratic Chain */}
            <div className="flex flex-col bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
              <div className="p-6 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-50 rounded-xl"><BookOpen className="w-5 h-5 text-purple-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Socratic Chain</h3>
                    <p className="text-xs text-purple-500 font-medium">2–5 rounds</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  AI reads each student's specific response and generates a personalised follow-up that targets the gap in <em>their</em> reasoning — different for every student.
                </p>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 flex-1">
                {[
                  { round: 1, label: 'Initial response',        emoji: '✍️', text: 'Everyone answers the opening question in their own words.' },
                  { round: 2, label: 'Personalised AI follow-up', emoji: '🤖', text: 'Claude reads each student\'s specific answer and generates a follow-up that probes the weakest point in their reasoning. Every student gets a different question.' },
                  { round: 3, label: 'Deepen the argument',     emoji: '💡', text: 'Students respond to their personal challenge. Each one confronts exactly what their argument left unanswered.' },
                ].map((r) => (
                  <div key={r.round} className="flex items-start gap-4 p-5">
                    <span className="text-xs font-mono font-bold text-purple-400 bg-purple-50 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">{r.round}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">{r.emoji} {r.label}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peer Clarification */}
            <div className="flex flex-col bg-white rounded-2xl border-2 border-teal-100 overflow-hidden">
              <div className="p-6 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-teal-50 rounded-xl"><HelpCircle className="w-5 h-5 text-teal-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Peer Clarification</h3>
                    <p className="text-xs text-teal-500 font-medium">2 rounds</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Students surface their own confusion, then explain a classmate's confusion in plain language. Teaching something is the surest test of understanding it.
                </p>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 flex-1">
                {[
                  { round: 1, label: 'Name your confusion', emoji: '🤔', text: 'Each student identifies the single most confusing point from today\'s material and describes it precisely.' },
                  { round: 2, label: 'Explain it to them',  emoji: '💬', text: 'Each student receives a different classmate\'s confusion and must explain it in plain language — no jargon, no looking it up.' },
                ].map((r) => (
                  <div key={r.round} className="flex items-start gap-4 p-5">
                    <span className="text-xs font-mono font-bold text-teal-400 bg-teal-50 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">{r.round}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">{r.emoji} {r.label}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Analysis */}
            <div className="flex flex-col bg-white rounded-2xl border-2 border-amber-100 overflow-hidden">
              <div className="p-6 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-50 rounded-xl"><BarChart2 className="w-5 h-5 text-amber-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Evidence Analysis</h3>
                    <p className="text-xs text-amber-500 font-medium">2 rounds · highest AI resistance</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  The instructor reveals a piece of data, quote, or case at session start. Students interpret it, then identify the inferential gap in a peer's reading.
                </p>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 flex-1">
                {[
                  { round: 1, label: 'Interpret the evidence', emoji: '🔬', text: 'Evidence not in the assigned readings is revealed live. Students interpret what it means for the question at hand.' },
                  { round: 2, label: 'Find the gap',           emoji: '🧩', text: 'Each student receives a peer\'s interpretation and must identify its biggest inferential gap or unsupported leap.' },
                ].map((r) => (
                  <div key={r.round} className="flex items-start gap-4 p-5">
                    <span className="text-xs font-mono font-bold text-amber-500 bg-amber-50 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">{r.round}</span>
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
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Simple pricing</h2>
            <p className="text-slate-500">Free to use today. Pro and Department tiers launching later this year.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Free */}
            <div className="flex flex-col p-7 bg-white rounded-2xl border-2 border-kiln-300 shadow-sm">
              <span className="inline-block text-xs font-bold text-kiln-600 bg-kiln-50 px-3 py-1 rounded-full uppercase tracking-wider mb-4 w-fit">Free</span>
              <div className="mb-5">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
                <span className="text-slate-400 ml-1 text-sm">/month</span>
              </div>
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {[
                  '10 sessions per month',
                  'Peer Critique + Socratic Chain',
                  'Up to 40 students per session',
                  'Live monitor & CSV export',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-kiln-500 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link to="/instructor" className="block text-center px-5 py-3 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white font-semibold rounded-xl hover:from-kiln-600 hover:to-kiln-700 transition-all shadow-md shadow-kiln-200 active:scale-95 text-sm">
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="flex flex-col p-7 bg-slate-900 rounded-2xl border-2 border-slate-700">
              <span className="inline-block text-xs font-bold text-kiln-400 bg-kiln-900 px-3 py-1 rounded-full uppercase tracking-wider mb-4 w-fit">Pro</span>
              <div className="mb-5">
                <span className="text-4xl font-extrabold text-white">$99</span>
                <span className="text-slate-400 ml-1 text-sm">/year</span>
              </div>
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {[
                  'Unlimited sessions',
                  'All four activity types',
                  'Projector view for class display',
                  'Async / take-home mode',
                  'Session analytics',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-kiln-400 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:charles.crabtree@monash.edu?subject=Kiln%20Pro%20Waitlist"
                className="flex items-center justify-center gap-2 px-5 py-3 bg-kiln-600 hover:bg-kiln-500 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                <Mail className="w-4 h-4" /> Join Pro waitlist
              </a>
            </div>

            {/* Department */}
            <div className="flex flex-col p-7 bg-slate-50 rounded-2xl border-2 border-slate-200">
              <span className="inline-block text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full uppercase tracking-wider mb-4 w-fit">Department</span>
              <div className="mb-5">
                <span className="text-4xl font-extrabold text-slate-400">$1,200</span>
                <span className="text-slate-400 ml-1 text-sm">/year</span>
              </div>
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {[
                  'Everything in Pro',
                  'Unlimited instructors in dept.',
                  'Canvas & Moodle LMS integration',
                  'SSO / institutional login',
                  'Priority support & onboarding',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-500">
                    <Check className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:charles.crabtree@monash.edu?subject=Kiln%20Department%20Enquiry"
                className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-300 transition-colors text-sm"
              >
                <Mail className="w-4 h-4" /> Contact us
              </a>
            </div>

          </div>
          <p className="text-center text-xs text-slate-400 mt-8">
            All tiers are free during the current beta. Billing begins when Pro and Department tiers launch.
          </p>
        </div>
      </section>

    </div>
  )
}
