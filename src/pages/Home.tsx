import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Users, BookOpen, HelpCircle, BarChart2, Check, Mail } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

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
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistDone, setWaitlistDone] = useState(false)

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    if (!waitlistEmail.trim()) return
    setWaitlistSubmitting(true)
    try {
      await supabase.from('waitlist').insert({ email: waitlistEmail.trim(), tier: 'pro' })
    } catch {
      // Table may not exist yet — still show success to capture intent
    } finally {
      setWaitlistDone(true)
      setWaitlistSubmitting(false)
    }
  }

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
      <section id="hero" className="w-full bg-kiln-50 border-b border-kiln-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-14 sm:py-20 lg:py-0 flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16 lg:min-h-[calc(100vh-3.5rem)]">

          {/* Left: copy + CTAs */}
          <div className="flex-1 flex flex-col gap-7 animate-fade-in lg:py-20">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-kiln-700 bg-white border border-kiln-200 shadow-sm px-3 py-1.5 rounded-full uppercase tracking-widest mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-kiln-500 inline-block"></span>
                Evidence-based formative assessment
              </span>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.0] mb-5">
                Active learning<br />
                <span className="text-kiln-500 italic">you can see.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-md">
                Timed writing activities grounded in retrieval practice, peer
                assessment, and Socratic questioning. Every student responds to
                content unique to them — on the spot, in class, while you watch.
              </p>
            </div>

            {/* Student join — primary action */}
            <div className="flex flex-col gap-3 max-w-md">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student? Enter your session code</p>
              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="flex-1 px-5 py-4 text-center text-2xl font-mono font-bold tracking-[0.3em] bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-kiln-400 transition-colors shadow-sm placeholder:text-slate-200 placeholder:tracking-[0.15em] placeholder:font-normal"
                />
                <button
                  type="submit"
                  disabled={!code.trim()}
                  className="px-5 py-4 bg-kiln-500 hover:bg-kiln-600 text-white rounded-2xl disabled:opacity-40 transition-all shadow-md shadow-kiln-200/50 active:scale-95"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </form>
              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-sm text-slate-400">Code is on the board or screen.</p>
                <Link
                  to="/instructor"
                  className="flex items-center gap-1.5 text-sm font-semibold text-kiln-600 hover:text-kiln-700 transition-colors whitespace-nowrap"
                >
                  Instructor sign up <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right: live monitor mockup — desktop only */}
          <div className="hidden lg:flex flex-1 flex-col w-full max-w-lg animate-slide-up py-20">
            <p className="text-xs font-bold text-kiln-600 uppercase tracking-widest text-center mb-3">
              What you see as the instructor
            </p>
            <LivePreview />
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="w-full bg-slate-950 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-xs font-bold text-kiln-500 uppercase tracking-widest mb-3">Getting started</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">Up and running in 60 seconds</h2>
            <p className="text-slate-400 max-w-sm">No student accounts. No downloads. Nothing to install.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { step: '01', title: 'Create an activity', body: 'Pick one of four activity types, write a prompt, set a timer. Templates included.', note: 'Takes under a minute.' },
              { step: '02', title: 'Students join with a code', body: 'Share a 6-character code. Students open it on any phone, tablet, or laptop — no account needed.', note: 'Works on any device.' },
              { step: '03', title: 'Watch it happen live', body: 'Responses appear in real time. See who submitted and what they wrote before the class ends.', note: 'Export CSV when done.' },
            ].map((s) => (
              <div key={s.step} className="flex flex-col gap-4 border-t border-slate-800 pt-8">
                <span className="text-sm font-mono font-bold text-kiln-600 tracking-widest">{s.step}</span>
                <h3 className="text-xl font-bold text-white">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-1">{s.body}</p>
                <p className="text-xs text-kiln-500 font-semibold">{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHAT YOU'RE SIGNING UP FOR ═══ */}
      <section id="features" className="w-full py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-xs font-bold text-kiln-500 uppercase tracking-widest mb-3">Activity types</p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">Each activity targets<br className="hidden sm:block" /> a different cognitive mechanism.</h2>
              <Link
                to="/pedagogy"
                className="inline-flex items-center gap-1.5 text-sm text-kiln-600 hover:text-kiln-700 font-semibold transition-colors shrink-0"
              >
                Evidence base <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Peer Critique */}
            <div className="flex flex-col bg-blue-50 rounded-2xl overflow-hidden">
              <div className="p-6 pb-5 border-b border-blue-100/60">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm"><Users className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Peer Critique</h3>
                    <p className="text-xs text-blue-500 font-medium">2 or 3 rounds</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Argumentation has three moves: construct a claim, locate the weakness in opposing reasoning, defend under scrutiny. This activity sequences all three in a single session.
                </p>
              </div>
              <div className="flex flex-col divide-y divide-blue-100/50 flex-1">
                {[
                  { round: 1, label: 'Construct a claim', emoji: '✍️', text: 'State a position and the evidence for it. Every student writes to the same prompt; every argument is their own.' },
                  { round: 2, label: 'Locate the weakest assumption', emoji: '🔍', text: 'Each student receives a peer\'s argument and must identify what it takes for granted — the move from evidence to conclusion it never justifies.' },
                  { round: 3, label: 'Respond to the critique', emoji: '⚔️', text: 'Students receive a critique of their own argument and write a rebuttal. Every student has been both author and critic.' },
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
            <div className="flex flex-col bg-purple-50 rounded-2xl overflow-hidden">
              <div className="p-6 pb-5 border-b border-purple-100/60">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm"><BookOpen className="w-5 h-5 text-purple-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Socratic Chain</h3>
                    <p className="text-xs text-purple-500 font-medium">2–5 rounds</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  The Socratic method at scale. Claude reads each student's response and generates a follow-up that targets the specific gap in <em>their</em> reasoning — not a generic prompt, but the question their own argument provoked.
                </p>
              </div>
              <div className="flex flex-col divide-y divide-purple-100/50 flex-1">
                {[
                  { round: 1, label: 'State your position', emoji: '✍️', text: 'Everyone answers the same opening question. From here, every student\'s path diverges.' },
                  { round: 2, label: 'The question your argument provoked', emoji: '🤖', text: 'Claude reads your response and generates a follow-up aimed at the weakest point in your reasoning. Every student receives a different question.' },
                  { round: 3, label: 'Pursue the question', emoji: '💡', text: 'Each student responds to their personal challenge — the gap their own argument created, now confronted directly.' },
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
            <div className="flex flex-col bg-teal-50 rounded-2xl overflow-hidden">
              <div className="p-6 pb-5 border-b border-teal-100/60">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm"><HelpCircle className="w-5 h-5 text-teal-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Peer Clarification</h3>
                    <p className="text-xs text-teal-500 font-medium">2 rounds</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Metacognitive awareness and peer-mediated explanation in one activity. Students first articulate what they don't understand — harder than it looks — then explain a different classmate's confusion in plain terms. Teaching something reorganises what the teacher knows.
                </p>
              </div>
              <div className="flex flex-col divide-y divide-teal-100/50 flex-1">
                {[
                  { round: 1, label: 'Name your confusion', emoji: '🤔', text: 'Identify what you don\'t yet understand well enough to explain. Describe precisely what\'s unclear — not just that it\'s unclear.' },
                  { round: 2, label: 'Explain it back', emoji: '💬', text: 'Receive a classmate\'s confusion and explain it in plain language — no jargon, no looking it up. Teaching is the test.' },
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
            <div className="flex flex-col bg-amber-50 rounded-2xl overflow-hidden">
              <div className="p-6 pb-5 border-b border-amber-100/60">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm"><BarChart2 className="w-5 h-5 text-amber-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Evidence Analysis</h3>
                    <p className="text-xs text-amber-500 font-medium">2 rounds · highest AI resistance</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Reveal a dataset, quotation, or case the students haven't seen. They interpret it cold, then identify the inferential leap in a peer's reading. The highest AI-resistance activity: the evidence doesn't exist until the moment it appears.
                </p>
              </div>
              <div className="flex flex-col divide-y divide-amber-100/50 flex-1">
                {[
                  { round: 1, label: 'Interpret the evidence', emoji: '🔬', text: 'Evidence not in the assigned readings is revealed live. Students interpret what it means, drawing on their own reasoning rather than pre-prepared material.' },
                  { round: 2, label: 'Identify the inferential gap', emoji: '🧩', text: 'Each student receives a peer\'s interpretation and must locate the biggest unsupported leap — the move from evidence to conclusion that doesn\'t hold.' },
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
      <section id="pricing" className="w-full py-16 sm:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-xs font-bold text-kiln-500 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 leading-tight">Simple pricing</h2>
            <p className="text-slate-500">Free to use today. Pro and Department tiers launching later this year.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Free */}
            <div className="flex flex-col p-5 sm:p-7 bg-white rounded-2xl border-2 border-kiln-300 shadow-sm">
              <span className="inline-block text-xs font-bold text-kiln-600 bg-kiln-50 px-3 py-1 rounded-full uppercase tracking-wider mb-4 w-fit">Free</span>
              <div className="mb-5">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
                <span className="text-slate-400 ml-1 text-sm">/month</span>
              </div>
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {[
                  '10 sessions per month',
                  'All four activity types',
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
            <div className="flex flex-col p-5 sm:p-7 bg-slate-900 rounded-2xl border-2 border-slate-700">
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
              {waitlistDone ? (
                <div className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white font-semibold rounded-xl text-sm">
                  <Check className="w-4 h-4" /> You're on the list!
                </div>
              ) : (
                <form onSubmit={handleWaitlist} className="flex gap-2">
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="your@email.edu"
                    className="flex-1 min-w-0 px-3 py-2.5 bg-slate-800 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:border-kiln-500 transition-colors"
                    required
                  />
                  <button
                    type="submit"
                    disabled={waitlistSubmitting || !waitlistEmail.trim()}
                    className="shrink-0 px-4 py-2.5 bg-kiln-600 hover:bg-kiln-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors text-sm"
                  >
                    {waitlistSubmitting ? '…' : 'Join'}
                  </button>
                </form>
              )}
            </div>

            {/* Department */}
            <div className="flex flex-col p-5 sm:p-7 bg-slate-50 rounded-2xl border-2 border-slate-200">
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
