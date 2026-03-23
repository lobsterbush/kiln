import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Users, BookOpen, HelpCircle, BarChart2, Check, MessageCircle, Network, Play, ShieldCheck } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { DemoPlayer } from '../components/marketing/DemoPlayer'


export function Home() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  useEffect(() => {
    if (!loading && user) navigate('/instructor', { replace: true })
  }, [user, loading, navigate])

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (code.trim()) navigate(`/join?code=${encodeURIComponent(code.trim().toUpperCase())}`)
  }

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section id="hero" className="w-full bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-24 lg:py-0 flex flex-col lg:flex-row lg:items-center gap-14 lg:gap-20 lg:min-h-[calc(100vh-3.5rem)]">

          <div className="flex-1 flex flex-col gap-8 animate-fade-in lg:py-24">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.08] mb-5">
                AI-resilient tools<br />
                <span className="text-kiln-600">for teaching.</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed max-w-md">
                Timed rounds, peer dependency, and personalised context make honest thinking
                faster than any AI shortcut. Students join with a code — no accounts, no
                downloads. Free for all instructors.
              </p>
            </div>

            {/* Student join */}
            <div className="flex flex-col gap-3 max-w-md">
              <p className="text-sm text-slate-400">Enter your session code to join</p>
              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="flex-1 px-5 py-3.5 text-center text-xl font-mono font-bold tracking-[0.3em] bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors placeholder:text-slate-200 placeholder:tracking-[0.15em] placeholder:font-normal"
                />
                <button
                  type="submit"
                  disabled={!code.trim()}
                  className="px-5 py-3.5 bg-kiln-600 hover:bg-kiln-700 text-white rounded-xl disabled:opacity-40 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-slate-400">Code is on the board or screen.</p>
                <Link
                  to="/instructor"
                  className="flex items-center gap-1.5 text-sm font-medium text-kiln-600 hover:text-kiln-700 transition-colors whitespace-nowrap"
                >
                  Instructor sign in <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <Link
                to="/demo"
                className="flex items-center justify-center gap-2 mt-3 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Play className="w-4 h-4" />
                Try a live demo — no sign-up needed
              </Link>
            </div>
          </div>

          {/* DemoPlayer — desktop only */}
          <div className="hidden lg:flex flex-1 flex-col w-full max-w-lg animate-slide-up py-24">
            <p className="text-sm text-slate-400 text-center mb-4">
              What instructors see — all six activity types
            </p>
            <DemoPlayer />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="w-full bg-slate-950 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">How it works</h2>
            <p className="text-slate-400 max-w-sm">No student accounts. No downloads. Nothing to install.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { step: '01', title: 'Create an activity', body: 'Pick one of six activity types, write a prompt or attach an image, set a timer. Templates included.' },
              { step: '02', title: 'Students join with a code', body: 'Share a 6-character code. Students open it on any phone, tablet, or laptop — no account needed.' },
              { step: '03', title: 'Watch it happen live', body: 'Responses appear in real time. See who submitted and what they wrote. Export to CSV when done.' },
            ].map((s) => (
              <div key={s.step} className="flex flex-col gap-4 border-t border-slate-800 pt-8">
                <span className="text-sm font-mono font-medium text-kiln-400 tracking-widest">{s.step}</span>
                <h3 className="text-xl font-bold text-white">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Free ── */}
      <section id="free" className="w-full py-14 sm:py-20 bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">Free for every instructor.</h2>
          <p className="text-slate-500 max-w-lg mx-auto mb-8">
            No credit card. No usage caps. No premium tier. Every activity type, every feature,
            every student — free. We built Kiln to improve teaching, not to monetise it.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto text-sm text-slate-600 font-medium">
            {['Unlimited sessions', 'Unlimited students', 'All six activity types', 'No student accounts'].map((f) => (
              <div key={f} className="py-3 px-3 bg-slate-50 rounded-lg">{f}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Activity types ── */}
      <section id="features" className="w-full py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Six activity types.<br className="hidden sm:block" />
              Each one AI-resilient by design.
            </h2>
            <Link
              to="/pedagogy"
              className="inline-flex items-center gap-1.5 text-sm text-kiln-600 hover:text-kiln-700 font-medium transition-colors shrink-0"
            >
              Evidence base <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <ActivityCard
              icon={<Users className="w-5 h-5 text-blue-600" />}
              borderColor="border-l-blue-400"
              name="Peer Critique"
              meta="2 or 3 rounds"
              description="Argumentation in three moves: construct a claim, locate the weakness in opposing reasoning, defend under scrutiny. All three in a single session."
              resilience="Timed rounds plus peer dependency — round 2 critiques a peer's argument that didn't exist until the session started; round 3 rebuts a critique of your own words."
              steps={[
                { n: 1, label: 'Construct a claim', text: 'State a position and the evidence for it. Every argument is the student\u2019s own.' },
                { n: 2, label: 'Locate the weakest assumption', text: 'Each student receives a peer\u2019s argument and must identify what it takes for granted.' },
                { n: 3, label: 'Respond to the critique', text: 'Students receive a critique of their own argument and write a rebuttal.' },
              ]}
            />

            <ActivityCard
              icon={<BookOpen className="w-5 h-5 text-purple-600" />}
              borderColor="border-l-purple-400"
              name="Socratic Chain"
              meta="2\u20135 rounds"
              description="The Socratic method at scale. The AI reads each student\u2019s response and generates a follow-up that targets the specific gap in their reasoning."
              resilience="Timed rounds and personalised follow-ups generated from your own prior response — copying it into a separate tool is slower than just thinking."
              steps={[
                { n: 1, label: 'State your position', text: 'Everyone answers the same opening question. From here, every path diverges.' },
                { n: 2, label: 'The question your argument provoked', text: 'The AI generates a follow-up aimed at the weakest point in your reasoning. Every student receives a different question.' },
                { n: 3, label: 'Pursue the question', text: 'Each student responds to their personal challenge \u2014 the gap their own argument created.' },
              ]}
            />

            <ActivityCard
              icon={<HelpCircle className="w-5 h-5 text-teal-600" />}
              borderColor="border-l-teal-400"
              name="Peer Clarification"
              meta="2 rounds"
              description="Students first articulate what they don\u2019t understand \u2014 harder than it looks \u2014 then explain a different classmate\u2019s confusion in plain terms."
              resilience="Timed rounds enforce real-time thinking. Naming your own confusion requires genuine metacognition; explaining a peer\u2019s specific confusion can\u2019t be pre-generated."
              steps={[
                { n: 1, label: 'Name your confusion', text: 'Identify what you don\u2019t yet understand well enough to explain. Describe precisely what\u2019s unclear.' },
                { n: 2, label: 'Explain it back', text: 'Receive a classmate\u2019s confusion and explain it in plain language \u2014 no jargon, no looking it up.' },
              ]}
            />

            <ActivityCard
              icon={<BarChart2 className="w-5 h-5 text-cyan-600" />}
              borderColor="border-l-cyan-400"
              name="Evidence Analysis"
              meta="2 rounds \u00b7 mixed media \u00b7 highest AI resistance"
              description="Reveal an image, dataset, document, or quotation the students haven\u2019t seen. They interpret it cold, then identify the inferential leap in a peer\u2019s reading."
              resilience="Highest AI-resilience: timed rounds, evidence that doesn\u2019t exist until it appears, and round 2 depends on a peer\u2019s interpretation that was just written."
              steps={[
                { n: 1, label: 'Interpret the evidence', text: 'Evidence not in the assigned readings is revealed live. Students interpret what it means from their own reasoning.' },
                { n: 2, label: 'Identify the inferential gap', text: 'Each student receives a peer\u2019s interpretation and must locate the biggest unsupported leap.' },
              ]}
            />

            <ActivityCard
              icon={<MessageCircle className="w-5 h-5 text-rose-600" />}
              borderColor="border-l-rose-400"
              name="Scenario Solo"
              meta="Open-ended turns \u00b7 one AI persona"
              description="Each student negotiates, argues, or navigates a scenario with a single AI persona. The AI adapts its position to each student\u2019s moves."
              resilience="Timed rounds and diverging conversations mean no two students face the same exchange \u2014 pre-generated answers are useless."
              steps={[
                { n: 1, label: 'Enter the scenario', text: 'The instructor sets context: your role, the stakes, who you are talking to.' },
                { n: 2, label: 'Exchange turns with an AI persona', text: 'The AI responds in character. Each student\u2019s conversation diverges immediately.' },
                { n: 3, label: 'Instructor evaluates with AI', text: 'One click runs a rubric evaluation across all transcripts.' },
              ]}
            />

            <ActivityCard
              icon={<Network className="w-5 h-5 text-indigo-600" />}
              borderColor="border-l-indigo-400"
              name="Scenario Multi"
              meta="Open-ended turns \u00b7 multiple AI personas"
              description="Each student faces a cast of personas the instructor defines. An AI orchestrator decides which stakeholder responds to each turn."
              resilience="Timed rounds, multi-party dynamics, and branching turns make each session unpredictable and impossible to outsource."
              steps={[
                { n: 1, label: 'Set the stage', text: 'Instructor defines the scenario, the student\u2019s role, and a cast of personas.' },
                { n: 2, label: 'Engage a cast of stakeholders', text: 'Each message is routed to the most contextually appropriate persona.' },
                { n: 3, label: 'Evaluate performance', text: 'The same one-click AI evaluation runs across all transcripts.' },
              ]}
            />

          </div>
        </div>
      </section>

      {/* ── Get started ── */}
      <section id="get-started" className="w-full py-16 sm:py-24 bg-slate-50">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">Start using Kiln today.</h2>
          <p className="text-slate-500 mb-10 max-w-md mx-auto">Create your first AI-resilient activity in under a minute.</p>
          <div className="bg-white rounded-xl border border-slate-200 p-7 mb-8">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
              {[
                'Unlimited sessions',
                'All six activity types',
                'Unlimited students per session',
                'Live instructor monitor',
                'AI Debrief & Evaluate All',
                'Image & document uploads',
                'Projector view',
                'CSV export',
                'Results & analytics',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-kiln-500 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link
              to="/instructor"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-kiln-600 text-white font-semibold rounded-xl hover:bg-kiln-700 transition-colors"
            >
              Get started free
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


/* ── Activity card component ── */

interface ActivityCardProps {
  icon: React.ReactNode
  borderColor: string
  name: string
  meta: string
  description: string
  resilience: string
  steps: { n: number; label: string; text: string }[]
}

function ActivityCard({ icon, borderColor, name, meta, description, resilience, steps }: ActivityCardProps) {
  return (
    <div className={`flex flex-col bg-white rounded-xl border border-slate-200 ${borderColor} border-l-[3px] overflow-hidden`}>
      <div className="p-6 pb-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{name}</h3>
            <p className="text-xs text-slate-400 font-medium">{meta}</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        <p className="text-xs text-slate-500 mt-3 flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-kiln-500 shrink-0 mt-0.5" />
          <span>{resilience}</span>
        </p>
      </div>
      <div className="flex flex-col divide-y divide-slate-100 border-t border-slate-100 flex-1">
        {steps.map((s) => (
          <div key={s.n} className="flex items-start gap-3 px-6 py-4">
            <span className="text-xs font-mono font-medium text-slate-400 w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-0.5">{s.label}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{s.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
