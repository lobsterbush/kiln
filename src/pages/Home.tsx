import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Users, BookOpen, HelpCircle, BarChart2, Check, MessageCircle, Network, Sparkles, Play, ShieldCheck } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { DemoPlayer } from '../components/marketing/DemoPlayer'


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
    if (code.trim()) navigate(`/join?code=${encodeURIComponent(code.trim().toUpperCase())}`)
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
                AI-resilient active learning
              </span>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.0] mb-5">
                AI-resilient tools<br />
                <span className="text-kiln-500 italic">for teaching.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-md">
                Every activity is designed so that honest thinking is faster than any AI shortcut.
                Timed rounds (30–120 s), peer dependency, and personalised context make each response
                unique and irreproducible. Students join with a code — no accounts, no downloads.
                Free for all instructors.
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

              {/* Demo CTA */}
              <Link
                to="/demo"
                className="flex items-center justify-center gap-2 mt-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-2xl transition-all shadow-md active:scale-95"
              >
                <Play className="w-4 h-4" />
                Try a live demo — no sign-up needed
              </Link>
            </div>
          </div>

          {/* Right: live monitor carousel — desktop only */}
          <div className="hidden lg:flex flex-1 flex-col w-full max-w-lg animate-slide-up py-20">
            <p className="text-xs font-bold text-kiln-600 uppercase tracking-widest text-center mb-3">
              What instructors see — all six activity types
            </p>
            <DemoPlayer />
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
              { step: '01', title: 'Create an activity', body: 'Pick one of six activity types, write a prompt, set a timer. Templates included.', note: 'Takes under a minute.' },
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

      {/* ═══ FREE FOR EVERYONE ═══ */}
      <section id="free" className="w-full py-14 sm:py-20 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full uppercase tracking-widest mb-5">
            100% free
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 leading-tight">Kiln is free for every instructor.</h2>
          <p className="text-slate-500 max-w-lg mx-auto mb-8">
            No credit card. No usage caps. No premium tier. Every activity type, every feature, every student — free.
            We built Kiln to improve teaching, not to monetise it.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { icon: '♾️', label: 'Unlimited sessions' },
              { icon: '👥', label: 'Unlimited students' },
              { icon: '🧪', label: 'All six activity types' },
              { icon: '🔓', label: 'No student accounts' },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2 bg-slate-50 rounded-xl py-4 px-3">
                <span className="text-2xl">{f.icon}</span>
                <span className="text-sm font-semibold text-slate-700">{f.label}</span>
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
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">Six activity types.<br className="hidden sm:block" /> Each one AI-resilient by design.</h2>
              <Link
                to="/pedagogy"
                className="inline-flex items-center gap-1.5 text-sm text-kiln-600 hover:text-kiln-700 font-semibold transition-colors shrink-0"
              >
                Evidence base <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Scenario Solo */}
            <div className="flex flex-col bg-rose-50 rounded-2xl overflow-hidden">
              <div className="p-6 pb-5 border-b border-rose-100/60">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm"><MessageCircle className="w-5 h-5 text-rose-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Scenario Solo</h3>
                    <p className="text-xs text-rose-500 font-medium">Open-ended turns · one AI persona</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Each student negotiates, argues, or navigates a scenario with a single AI persona. The AI adapts its position to each student's moves, creating a unique and irreproducible exchange.
                </p>
                <p className="text-xs text-rose-600 font-medium mt-2 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 shrink-0" /> AI-resilient: timed rounds and diverging conversations mean no two students face the same exchange — pre-generated answers are useless.</p>
              </div>
              <div className="flex flex-col divide-y divide-rose-100/50 flex-1">
                {[
                  { round: 1, label: 'Enter the scenario', emoji: '🎭', text: 'The instructor sets context: your role, the stakes, who you are talking to. Students begin when the session opens.' },
                  { round: 2, label: 'Exchange turns with an AI persona', emoji: '🤖', text: 'The AI responds in character — as foreign minister, employer, hostile journalist, or any persona the instructor defines. Each student’s conversation diverges immediately.' },
                  { round: 3, label: 'Instructor evaluates with AI', emoji: '📋', text: 'One click runs a rubric evaluation across all transcripts. Scores and feedback per student, ready to review or export.' },
                ].map((r) => (
                  <div key={r.round} className="flex items-start gap-4 p-5">
                    <span className="text-xs font-mono font-bold text-rose-400 bg-rose-50 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">{r.round}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">{r.emoji} {r.label}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scenario Multi */}
            <div className="flex flex-col bg-indigo-50 rounded-2xl overflow-hidden">
              <div className="p-6 pb-5 border-b border-indigo-100/60">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm"><Network className="w-5 h-5 text-indigo-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Scenario Multi</h3>
                    <p className="text-xs text-indigo-500 font-medium">Open-ended turns · multiple AI personas</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  A richer simulation: each student faces a cast of personas the instructor defines. An AI orchestrator decides which stakeholder responds to each turn, making each conversation genuinely multi-party.
                </p>
                <p className="text-xs text-indigo-600 font-medium mt-2 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 shrink-0" /> AI-resilient: timed rounds, multi-party dynamics, and branching turns make each session unpredictable and impossible to outsource.</p>
              </div>
              <div className="flex flex-col divide-y divide-indigo-100/50 flex-1">
                {[
                  { round: 1, label: 'Set the stage', emoji: '🏛️', text: 'Instructor defines the scenario, the student’s role, and a cast of personas — each with a name, position, and disposition.' },
                  { round: 2, label: 'Engage a cast of stakeholders', emoji: '🗣️', text: 'Each student message is routed to the most contextually appropriate persona. The cast maintains consistent positions; the conversation is coherent, not random.' },
                  { round: 3, label: 'Evaluate performance across the room', emoji: '📊', text: 'The same one-click AI evaluation runs across all transcripts, scoring against the same rubric so comparisons are fair.' },
                ].map((r) => (
                  <div key={r.round} className="flex items-start gap-4 p-5">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-50 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">{r.round}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">{r.emoji} {r.label}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
                <p className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 shrink-0" /> AI-resilient: timed rounds plus peer dependency — round 2 critiques a peer's argument that didn't exist until the session started; round 3 rebuts a critique of your own words.</p>
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
                <p className="text-xs text-purple-600 font-medium mt-2 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 shrink-0" /> AI-resilient: timed rounds and personalised follow-ups generated from your own prior response — copying it into a separate tool is slower than just thinking.</p>
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
                <p className="text-xs text-teal-600 font-medium mt-2 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 shrink-0" /> AI-resilient: timed rounds enforce real-time thinking. Naming your own confusion requires genuine metacognition; explaining a peer's specific confusion can't be pre-generated.</p>
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
                    <p className="text-xs text-amber-500 font-medium">2 rounds · mixed media · highest AI resistance</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Reveal an image, dataset, document, or quotation the students haven't seen. They interpret it cold, then identify the inferential leap in a peer's reading.
                </p>
                <p className="text-xs text-amber-600 font-medium mt-2 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Highest AI-resilience: timed rounds, evidence that doesn't exist until it appears, and round 2 depends on a peer's interpretation that was just written.</p>
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

      {/* ═══ GET STARTED ═══ */}
      <section id="get-started" className="w-full py-16 sm:py-24 bg-slate-50">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 leading-tight">Start using Kiln today.</h2>
          <p className="text-slate-500 mb-10 max-w-md mx-auto">Create your first AI-resilient activity in under a minute. Your feedback shapes what gets built next.</p>
          <div className="bg-white rounded-2xl border-2 border-kiln-200 shadow-sm p-7 mb-8">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
              {[
                'Unlimited sessions',
                'All six activity types',
                'Unlimited students per session',
                'Live instructor monitor',
                'AI Debrief & Evaluate All',
                'Projector view',
                'CSV export',
                'Results & analytics',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-kiln-500 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link
              to="/instructor"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white font-semibold rounded-xl hover:from-kiln-600 hover:to-kiln-700 transition-all shadow-md shadow-kiln-200 active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Get started free
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            Questions? <a href="mailto:feedback@usekiln.org" className="text-kiln-600 hover:underline">feedback@usekiln.org</a>
          </p>
        </div>
      </section>

    </div>
  )
}
