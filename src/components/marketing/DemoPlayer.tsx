import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Turn = { speaker: 'student' | 'ai'; name: string; text: string }

interface Student {
  name: string
  initials: string
  avatar: string       // full static tailwind classes
  response?: string    // round-based activities
  aiLabel?: string     // socratic chain
  turns?: Turn[]       // scenario activities
}

interface RoundResult {
  kind: 'round'
  themes: [string, string]
  suggestion: string
}

interface ScenarioResult {
  kind: 'scenario'
  evalName: string
  scores: { label: string; val: number }[]
  feedback: string
}

type SceneResult = RoundResult | ScenarioResult

interface Scene {
  type: string
  label: string
  badge: string        // full static tailwind badge classes
  accent: string       // text color class
  bar: string          // gradient classes
  title: string
  prompt: string
  meta: string
  code: string
  isScenario?: boolean
  students: Student[]
  result: SceneResult
}

// ─── Scene data ───────────────────────────────────────────────────────────────
const SCENES: Scene[] = [
  {
    type: 'peer_critique',
    label: 'Peer Critique',
    badge: 'bg-blue-100 text-blue-700',
    accent: 'text-blue-600',
    bar: 'from-blue-400 to-blue-500',
    title: 'Democratic Backsliding',
    prompt: "Identify the weakest assumption in your peer's argument.",
    meta: 'Round 2 · Critique',
    code: 'XK7R4P',
    result: {
      kind: 'round',
      themes: ['Economic determinism as default assumption', 'Counterfactuals consistently absent'],
      suggestion: 'Ask: what evidence would change your mind about the mechanism?',
    },
    students: [
      { name: 'Priya K.',  initials: 'PK', avatar: 'bg-blue-100 text-blue-700',    response: 'Assumes economic decline causes erosion without explaining the mechanism…' },
      { name: 'Marcus T.', initials: 'MT', avatar: 'bg-purple-100 text-purple-700', response: 'The causal claim is asserted, not demonstrated — Hungary and Poland diverge.' },
      { name: 'Sofia L.',  initials: 'SL', avatar: 'bg-teal-100 text-teal-700' },
      { name: 'James W.',  initials: 'JW', avatar: 'bg-amber-100 text-amber-700',   response: 'Conflates correlation with causation in the electoral systems comparison.' },
      { name: 'Aisha M.',  initials: 'AM', avatar: 'bg-rose-100 text-rose-700' },
      { name: 'Dev R.',    initials: 'DR', avatar: 'bg-indigo-100 text-indigo-700', response: 'No counterfactual offered — why these cases and not others?' },
    ],
  },
  {
    type: 'socratic_chain',
    label: 'Socratic Chain',
    badge: 'bg-purple-100 text-purple-700',
    accent: 'text-purple-600',
    bar: 'from-purple-400 to-purple-500',
    title: 'Social Contract Theory',
    prompt: 'Each student receives a personalised AI follow-up question.',
    meta: 'Round 2 · AI Follow-up',
    code: 'MN3KQ8',
    result: {
      kind: 'round',
      themes: ['Strong initial positions, shallow follow-through', '4 of 5 avoided the falsification question'],
      suggestion: 'Pause on the falsification question — it surfaces the real disagreements.',
    },
    students: [
      { name: 'Priya K.',  initials: 'PK', avatar: 'bg-blue-100 text-blue-700',    aiLabel: 'If institutions explain backsliding, why did Poland recover while Hungary did not?' },
      { name: 'Marcus T.', initials: 'MT', avatar: 'bg-purple-100 text-purple-700', aiLabel: 'You argue elites defect — what prevents defection earlier in the process?' },
      { name: 'Sofia L.',  initials: 'SL', avatar: 'bg-teal-100 text-teal-700',    aiLabel: 'What evidence would falsify your central causal claim?' },
      { name: 'James W.',  initials: 'JW', avatar: 'bg-amber-100 text-amber-700' },
      { name: 'Dev R.',    initials: 'DR', avatar: 'bg-indigo-100 text-indigo-700', aiLabel: 'How does civil society slow consolidation in your model?' },
    ],
  },
  {
    type: 'peer_clarification',
    label: 'Peer Clarification',
    badge: 'bg-teal-100 text-teal-700',
    accent: 'text-teal-600',
    bar: 'from-teal-400 to-teal-500',
    title: 'Veto Players & Institutional Change',
    prompt: "Explain a classmate's confusion in plain language — no jargon.",
    meta: 'Round 2 · Explanation',
    code: 'PQ5T2M',
    result: {
      kind: 'round',
      themes: ["Students identified confusion but couldn't isolate it", 'Explanation quality varied widely'],
      suggestion: 'Pair the two strongest explainers with the two most confused students tomorrow.',
    },
    students: [
      { name: 'Priya K.',  initials: 'PK', avatar: 'bg-blue-100 text-blue-700',    response: "A veto player is any actor whose agreement is required — like a lock before policy moves." },
      { name: 'Marcus T.', initials: 'MT', avatar: 'bg-purple-100 text-purple-700' },
      { name: 'Sofia L.',  initials: 'SL', avatar: 'bg-teal-100 text-teal-700',    response: "Preference diversity matters more than count. Many actors with similar preferences still change policy." },
      { name: 'James W.',  initials: 'JW', avatar: 'bg-amber-100 text-amber-700',  response: "The EU has many veto players but shared preferences, so change happens. Number alone misleads." },
    ],
  },
  {
    type: 'evidence_analysis',
    label: 'Evidence Analysis',
    badge: 'bg-amber-100 text-amber-700',
    accent: 'text-amber-600',
    bar: 'from-amber-400 to-amber-500',
    title: 'Electoral Fragmentation 1990–2022',
    prompt: '[Fig. 3] Party fragmentation in 12 new democracies. What does this reveal?',
    meta: 'Round 1 · Interpretation',
    code: 'BR9W6L',
    result: {
      kind: 'round',
      themes: ['GDP correlation spotted by all, causation unaddressed', 'Regime-type heterogeneity missed'],
      suggestion: 'Reveal the regression table next — let them see what they missed.',
    },
    students: [
      { name: 'Priya K.',  initials: 'PK', avatar: 'bg-blue-100 text-blue-700',    response: 'Fragmentation spikes after economic crises — volatility appears structurally driven.' },
      { name: 'Marcus T.', initials: 'MT', avatar: 'bg-purple-100 text-purple-700', response: "Outliers in years 3–5 suggest the effect isn't uniform across regime types." },
      { name: 'Sofia L.',  initials: 'SL', avatar: 'bg-teal-100 text-teal-700' },
      { name: 'James W.',  initials: 'JW', avatar: 'bg-amber-100 text-amber-700',  response: 'Electoral systems mediate the relationship — the trend line hides significant variation.' },
      { name: 'Dev R.',    initials: 'DR', avatar: 'bg-indigo-100 text-indigo-700', response: 'Correlation with GDP growth is conspicuous but causal direction remains ambiguous.' },
    ],
  },
  {
    type: 'scenario_solo',
    label: 'Scenario Solo',
    badge: 'bg-rose-100 text-rose-700',
    accent: 'text-rose-600',
    bar: 'from-rose-400 to-rose-500',
    title: 'Treaty Negotiation',
    prompt: 'You are a junior diplomat. Negotiate arms reduction with Minister Chen.',
    meta: 'Open turns · 1 persona',
    code: 'DK4F9N',
    isScenario: true,
    result: {
      kind: 'scenario',
      evalName: 'Priya K.',
      scores: [
        { label: 'Reasoning',     val: 8 },
        { label: 'Communication', val: 7 },
        { label: 'Evidence',      val: 9 },
        { label: 'Ethics',        val: 8 },
      ],
      feedback: 'Strong verification framing. Push harder on the compliance mechanism — what happens when the commission disagrees?',
    },
    students: [
      {
        name: 'Priya K.', initials: 'PK', avatar: 'bg-blue-100 text-blue-700',
        turns: [
          { speaker: 'student', name: 'Priya',     text: 'Minister, our proposal includes phased verification protocols that address your security concerns.' },
          { speaker: 'ai',      name: 'Min. Chen', text: 'Phased timelines have failed before. What specific mechanism guarantees compliance?' },
          { speaker: 'student', name: 'Priya',     text: 'A joint monitoring commission with equal representation and real-time data sharing.' },
          { speaker: 'ai',      name: 'Min. Chen', text: "Equal representation assumes symmetric trust we don't yet have. Who arbitrates disputes?" },
        ],
      },
      { name: 'Marcus T.', initials: 'MT', avatar: 'bg-purple-100 text-purple-700', turns: [
        { speaker: 'student', name: 'Marcus',    text: 'We can offer economic incentives alongside phased disarmament.' },
        { speaker: 'ai',      name: 'Min. Chen', text: "Economic incentives won't substitute for sovereign security guarantees." },
      ]},
      { name: 'Sofia L.',  initials: 'SL', avatar: 'bg-teal-100 text-teal-700',    turns: [] },
      { name: 'James W.',  initials: 'JW', avatar: 'bg-amber-100 text-amber-700',  turns: [
        { speaker: 'student', name: 'James',     text: 'Our domestic coalition requires visible concessions before we can proceed.' },
        { speaker: 'ai',      name: 'Min. Chen', text: 'So does ours. Who moves first, and what guarantees do we have?' },
      ]},
    ],
  },
  {
    type: 'scenario_multi',
    label: 'Scenario Multi',
    badge: 'bg-indigo-100 text-indigo-700',
    accent: 'text-indigo-600',
    bar: 'from-indigo-400 to-indigo-500',
    title: 'Urban Rezoning Town Hall',
    prompt: 'You are a concerned resident. Three stakeholders are present.',
    meta: 'Open turns · 3 personas',
    code: 'LM8P3X',
    isScenario: true,
    result: {
      kind: 'scenario',
      evalName: 'Priya K.',
      scores: [
        { label: 'Reasoning',     val: 7 },
        { label: 'Communication', val: 9 },
        { label: 'Evidence',      val: 7 },
        { label: 'Ethics',        val: 8 },
      ],
      feedback: 'Excellent multi-party engagement. Infrastructure cost question was the most effective move. Affordable housing argument needed specifics.',
    },
    students: [
      {
        name: 'Priya K.', initials: 'PK', avatar: 'bg-blue-100 text-blue-700',
        turns: [
          { speaker: 'student', name: 'Priya',        text: 'Increased density will fundamentally change the neighbourhood character residents value.' },
          { speaker: 'ai',      name: 'Developer',    text: "Character and housing supply aren't mutually exclusive. Our design preserves the streetscape." },
          { speaker: 'student', name: 'Priya',        text: 'Who bears the infrastructure cost of 400 additional units?' },
          { speaker: 'ai',      name: 'City Planner', text: 'Council levies cover trunk infrastructure. Local upgrades are assessed separately.' },
        ],
      },
      { name: 'Marcus T.', initials: 'MT', avatar: 'bg-purple-100 text-purple-700', turns: [
        { speaker: 'student', name: 'Marcus',       text: 'The traffic impact study has significant gaps in peak-hour modelling.' },
        { speaker: 'ai',      name: 'City Planner', text: "The study meets statutory requirements. Please specify which methodology you're questioning." },
      ]},
      { name: 'Sofia L.',  initials: 'SL', avatar: 'bg-teal-100 text-teal-700',    turns: [] },
      { name: 'Aisha M.',  initials: 'AM', avatar: 'bg-rose-100 text-rose-700',    turns: [
        { speaker: 'student', name: 'Aisha',     text: 'Affordable units must be genuinely affordable — not just defined that way on paper.' },
        { speaker: 'ai',      name: 'Developer', text: 'We\'re at 20% below market rate. Define "genuinely" with a number.' },
      ]},
    ],
  },
]

// ─── Cursor SVG ───────────────────────────────────────────────────────────────
function CursorIcon({ clicking }: { clicking: boolean }) {
  return (
    <svg
      width="18" height="22" viewBox="0 0 18 22" fill="none"
      style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))' }}
      className={`transition-transform duration-100 ${clicking ? 'scale-90' : 'scale-100'}`}
    >
      <path
        d="M2 2L2 18L6.5 13.5L9.5 21L12 20L9 12.5L15.5 12.5L2 2Z"
        fill="white" stroke="#1e293b" strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function DemoPlayer() {
  const [sceneIdx,   setSceneIdx]   = useState(0)
  const [joined,     setJoined]     = useState(0)
  const [responded,  setResponded]  = useState(0)
  const [cursor,     setCursor]     = useState({ x: 415, y: 26 })
  const [clicking,   setClicking]   = useState(false)
  const [fading,     setFading]     = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [paused,     setPaused]     = useState(false)

  useEffect(() => {
    if (paused) return

    // Reset all animation state for the new scene
    setJoined(0)
    setResponded(0)
    setCursor({ x: 415, y: 26 })
    setClicking(false)
    setShowResult(false)
    setFading(false)

    const T: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => T.push(setTimeout(fn, ms))
    const click = (ms: number) => {
      at(ms,       () => setClicking(true))
      at(ms + 170, () => setClicking(false))
    }

    const sc = SCENES[sceneIdx]
    const n  = sc.students.length

    // Phase 1: All students fade/slide in together
    at(250, () => setJoined(n))
    const joinedAt = 550

    if (!sc.isScenario) {
      // Phase 2: Cursor drifts over student grid
      at(joinedAt,       () => setCursor({ x: 200, y: 175 }))
      at(joinedAt + 320, () => setCursor({ x: 215, y: 215 }))

      // Phase 3: Responses/AI labels appear one by one
      const withContent = sc.students.filter((s) => s.response || s.aiLabel)
      for (let i = 0; i < withContent.length; i++) {
        at(joinedAt + 480 + i * 320, () => setResponded((r) => r + 1))
      }
      const respondedAt = joinedAt + 480 + withContent.length * 320

      // Phase 4: Cursor to AI Debrief button, click
      at(respondedAt + 120, () => setCursor({ x: 68, y: 348 }))
      click(respondedAt + 580)

      // Phase 5: Show AI result panel
      at(respondedAt + 800, () => setShowResult(true))

      // Phase 6: Fade out → advance
      at(respondedAt + 2900, () => setFading(true))
      at(respondedAt + 3250, () => setSceneIdx((i) => (i + 1) % SCENES.length))
    } else {
      // Phase 2: Cursor drifts over participant list
      at(joinedAt + 100, () => setCursor({ x: 240, y: 190 }))

      // Phase 3: Cursor to Evaluate All button, click
      at(joinedAt + 620, () => setCursor({ x: 68, y: 348 }))
      click(joinedAt + 900)

      // Phase 4: Show AI result panel
      at(joinedAt + 1120, () => setShowResult(true))

      // Phase 5: Fade out → advance
      at(joinedAt + 3200, () => setFading(true))
      at(joinedAt + 3550, () => setSceneIdx((i) => (i + 1) % SCENES.length))
    }

    return () => T.forEach(clearTimeout)
  }, [sceneIdx, paused])

  const sc = SCENES[sceneIdx]

  // Map `responded` counter onto students-with-content in order,
  // counting only students that have already joined.
  let contentSeen = 0
  const displayData = sc.students.map((s, i) => {
    const isJoined   = i < joined
    const hasContent = !!(s.response || s.aiLabel)
    let showContent  = false
    if (hasContent && isJoined) {
      contentSeen++
      showContent = contentSeen <= responded
    }
    return { ...s, isJoined, showContent }
  })

  const joinedCount    = Math.min(joined, sc.students.length)
  const submittedCount = sc.isScenario
    ? sc.students.slice(0, joined).filter((s) => (s.turns?.length ?? 0) > 0).length
    : displayData.filter((d) => d.showContent).length
  const pct = joinedCount > 0 ? Math.round((submittedCount / joinedCount) * 100) : 0

  const result = sc.result

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Demo window — fixed height prevents layout shifts during scene changes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden flex flex-col h-[430px]">

        {/* Fake browser chrome — always visible, never participates in scene fade */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
          <div className="flex-1 mx-2">
            <div className="bg-white border border-slate-100 rounded px-2 py-0.5 text-[10px] text-slate-400 font-mono text-center">
              app.kiln.education/instructor/session
            </div>
          </div>
        </div>

        {/* Scene content — fades as a single unit between scenes */}
        <div
          className="flex flex-col flex-1 overflow-hidden"
          style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}
        >
          {/* Activity header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 shrink-0">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${sc.badge}`}>
              {sc.label}
            </span>
            <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              {sc.code}
            </span>
          </div>

          {/* Session info + progress bar */}
          <div className="px-4 pt-3 pb-2.5 shrink-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm font-bold text-slate-900 leading-tight">{sc.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic">{sc.prompt}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-base font-bold leading-tight ${sc.accent}`}>
                  {submittedCount}<span className="text-slate-400 font-normal text-sm">/{sc.students.length}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{sc.meta}</p>
              </div>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${sc.bar} rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Student area — flex-1, relative so result overlay can be absolute */}
          <div className="px-4 pb-2 flex-1 overflow-hidden relative">
            {sc.isScenario ? (
              // Scenario: compact participant rows with turn-count progress bars
              // (no card expansion — avoids height-shift jumps)
              <div className="flex flex-col gap-1.5">
                {sc.students.map((s, i) => {
                  const isJoined     = i < joined
                  const studentTurns = s.turns?.filter((t) => t.speaker === 'student').length ?? 0
                  const hasTurns     = (s.turns?.length ?? 0) > 0
                  return (
                    <div
                      key={s.name}
                      className="rounded-xl border border-slate-100 bg-white px-3 py-2"
                      style={{
                        opacity:    isJoined ? 1 : 0,
                        transform:  isJoined ? 'translateY(0px)' : 'translateY(6px)',
                        transition: 'opacity 0.3s ease, transform 0.3s ease',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${s.avatar}`}>
                          {s.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-slate-800">{s.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${sc.bar} rounded-full transition-all duration-700`}
                                style={{ width: isJoined ? `${Math.min(100, (studentTurns / 4) * 100)}%` : '0%' }}
                              />
                            </div>
                            <span className="text-[9px] text-slate-400">{studentTurns} turns</span>
                          </div>
                        </div>
                        {hasTurns && isJoined && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc.badge}`}>
                            active
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Round-based: 2-column student grid
              // All students always rendered; opacity/translate controlled by isJoined
              <div className="grid grid-cols-2 gap-2">
                {displayData.map((s) => {
                  const hasContent = !!(s.response || s.aiLabel)
                  return (
                    <div
                      key={s.name}
                      className={`rounded-xl border p-2 ${
                        s.showContent
                          ? 'border-emerald-200 bg-white'
                          : hasContent
                          ? 'border-slate-200 bg-slate-50'
                          : 'border-slate-100 bg-slate-50/50'
                      }`}
                      style={{
                        opacity:    s.isJoined ? 1 : 0,
                        transform:  s.isJoined ? 'translateY(0px)' : 'translateY(6px)',
                        transition: 'opacity 0.3s ease, transform 0.3s ease',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${s.avatar}`}>
                            {s.initials}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700">{s.name}</span>
                        </div>
                        {s.showContent ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">✓</span>
                        ) : hasContent && s.isJoined ? (
                          <span className="text-[9px] text-slate-400 animate-pulse">writing…</span>
                        ) : null}
                      </div>
                      {s.showContent && (
                        <p className={`text-[10px] line-clamp-2 leading-relaxed ${s.aiLabel ? 'text-purple-600' : 'text-slate-500'}`}>
                          {s.aiLabel ? `✨ ${s.aiLabel}` : s.response}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── AI result overlay — fades in over the student area after button click ── */}
            {result.kind === 'round' ? (
              <div
                className="absolute inset-0 bg-white/[0.97] rounded-xl px-4 py-3 flex flex-col justify-center"
                style={{
                  opacity:       showResult ? 1 : 0,
                  pointerEvents: showResult ? 'auto' : 'none',
                  transition:    'opacity 0.3s ease',
                }}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-[11px] font-bold text-purple-700">AI Debrief</span>
                  <span className="ml-auto text-[9px] text-slate-400">generated in 1.2s</span>
                </div>
                <div className="space-y-2 mb-3">
                  {result.themes.map((theme, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-[3px] shrink-0" />
                      <p className="text-[10px] text-slate-700 leading-relaxed">{theme}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-purple-700 leading-relaxed">
                    <span className="font-semibold">Suggestion: </span>{result.suggestion}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="absolute inset-0 bg-white/[0.97] rounded-xl px-4 py-3 flex flex-col justify-center"
                style={{
                  opacity:       showResult ? 1 : 0,
                  pointerEvents: showResult ? 'auto' : 'none',
                  transition:    'opacity 0.3s ease',
                }}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-[11px] font-bold text-rose-700">AI Evaluation</span>
                  <span className="text-[10px] text-slate-500 ml-1">· {result.evalName}</span>
                  <span className="ml-auto text-[9px] text-slate-400">generated in 1.8s</span>
                </div>
                <div className="flex gap-2 mb-3">
                  {result.scores.map(({ label, val }) => (
                    <div key={label} className="flex-1 bg-rose-50 border border-rose-100 rounded-lg px-1.5 py-2 text-center">
                      <p className="text-[8px] text-rose-400 font-medium leading-tight mb-0.5">{label}</p>
                      <p className="text-sm font-bold text-rose-600 leading-none">
                        {val}<span className="text-[8px] text-rose-400">/10</span>
                      </p>
                    </div>
                  ))}
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-rose-700 leading-relaxed">{result.feedback}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/40 shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-150 ${
              clicking
                ? `bg-gradient-to-r ${sc.bar} text-white border-transparent scale-95 shadow-sm`
                : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <Sparkles className="w-3 h-3" />
              {sc.isScenario ? 'Evaluate All' : 'AI Debrief'}
            </div>
            <div className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-gradient-to-r from-kiln-500 to-kiln-600 text-white">
              {sc.isScenario ? 'End Session' : 'Advance →'}
            </div>
          </div>
        </div>{/* end scene content */}
      </div>

      {/* Animated cursor */}
      <div
        className="absolute pointer-events-none z-10"
        style={{
          left: `${cursor.x}px`,
          top:  `${cursor.y}px`,
          transition: 'left 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {clicking && (
          <div className="absolute -translate-x-2 -translate-y-2 w-5 h-5 rounded-full border-2 border-kiln-400 animate-ping opacity-75" />
        )}
        <CursorIcon clicking={clicking} />
      </div>

      {/* Scene dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {SCENES.map((s, i) => (
          <button
            key={i}
            onClick={() => { setSceneIdx(i); setPaused(false) }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === sceneIdx ? 'w-5 bg-kiln-500' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={s.label}
          />
        ))}
      </div>
    </div>
  )
}
