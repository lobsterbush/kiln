import { useState, useEffect } from 'react'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Turn = { speaker: 'student' | 'ai'; name: string; text: string }

interface Student {
  name: string
  initials: string
  avatar: string     // full static tailwind classes
  response?: string  // round-based activities
  aiLabel?: string   // socratic chain
  turns?: Turn[]     // scenario activities
}

interface Scene {
  type: string
  label: string
  badge: string      // full static tailwind badge classes
  accent: string     // text color class
  bar: string        // gradient classes (from-xxx to-xxx)
  bubble: string     // AI chat bubble bg+text classes
  title: string
  prompt: string
  meta: string
  code: string
  isScenario?: boolean
  students: Student[]
}

// ─── Scene data ───────────────────────────────────────────────────────────────
const SCENES: Scene[] = [
  {
    type: 'peer_critique',
    label: 'Peer Critique',
    badge: 'bg-blue-100 text-blue-700',
    accent: 'text-blue-600',
    bar: 'from-blue-400 to-blue-500',
    bubble: 'bg-blue-500 text-white',
    title: 'Democratic Backsliding',
    prompt: "Identify the weakest assumption in your peer's argument.",
    meta: 'Round 2 · Critique',
    code: 'XK7R4P',
    students: [
      { name: 'Priya K.',  initials: 'PK', avatar: 'bg-blue-100 text-blue-700',   response: 'Assumes economic decline causes erosion without explaining the mechanism…' },
      { name: 'Marcus T.', initials: 'MT', avatar: 'bg-purple-100 text-purple-700', response: 'The causal claim is asserted, not demonstrated — Hungary and Poland diverge.' },
      { name: 'Sofia L.',  initials: 'SL', avatar: 'bg-teal-100 text-teal-700' },
      { name: 'James W.',  initials: 'JW', avatar: 'bg-amber-100 text-amber-700',  response: 'Conflates correlation with causation in the electoral systems comparison.' },
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
    bubble: 'bg-purple-500 text-white',
    title: 'Social Contract Theory',
    prompt: 'Each student receives a personalised AI follow-up question.',
    meta: 'Round 2 · AI Follow-up',
    code: 'MN3KQ8',
    students: [
      { name: 'Priya K.',  initials: 'PK', avatar: 'bg-blue-100 text-blue-700',   aiLabel: 'If institutions explain backsliding, why did Poland recover while Hungary did not?' },
      { name: 'Marcus T.', initials: 'MT', avatar: 'bg-purple-100 text-purple-700', aiLabel: 'You argue elites defect — what prevents defection earlier in the process?' },
      { name: 'Sofia L.',  initials: 'SL', avatar: 'bg-teal-100 text-teal-700',   aiLabel: 'What evidence would falsify your central causal claim?' },
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
    bubble: 'bg-teal-500 text-white',
    title: 'Veto Players & Institutional Change',
    prompt: "Explain a classmate's confusion in plain language — no jargon.",
    meta: 'Round 2 · Explanation',
    code: 'PQ5T2M',
    students: [
      { name: 'Priya K.',  initials: 'PK', avatar: 'bg-blue-100 text-blue-700',   response: "A veto player is any actor whose agreement is required — like a lock that must be opened before policy moves." },
      { name: 'Marcus T.', initials: 'MT', avatar: 'bg-purple-100 text-purple-700' },
      { name: 'Sofia L.',  initials: 'SL', avatar: 'bg-teal-100 text-teal-700',   response: "Preference diversity matters more than player count. Many actors with similar preferences still change policy." },
      { name: 'James W.',  initials: 'JW', avatar: 'bg-amber-100 text-amber-700',  response: "The EU has many veto players but broad shared preferences, so change still happens. Number alone is misleading." },
    ],
  },
  {
    type: 'evidence_analysis',
    label: 'Evidence Analysis',
    badge: 'bg-amber-100 text-amber-700',
    accent: 'text-amber-600',
    bar: 'from-amber-400 to-amber-500',
    bubble: 'bg-amber-500 text-white',
    title: 'Electoral Fragmentation 1990–2022',
    prompt: '[Fig. 3] Party fragmentation in 12 new democracies. What does this reveal?',
    meta: 'Round 1 · Interpretation',
    code: 'BR9W6L',
    students: [
      { name: 'Priya K.',  initials: 'PK', avatar: 'bg-blue-100 text-blue-700',   response: 'Fragmentation spikes after economic crises — volatility appears structurally driven, not random.' },
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
    bubble: 'bg-rose-500 text-white',
    title: 'Treaty Negotiation',
    prompt: 'You are a junior diplomat. Negotiate arms reduction with Minister Chen.',
    meta: 'Open turns · 1 persona',
    code: 'DK4F9N',
    isScenario: true,
    students: [
      {
        name: 'Priya K.', initials: 'PK', avatar: 'bg-blue-100 text-blue-700',
        turns: [
          { speaker: 'student', name: 'Priya', text: 'Minister, our proposal includes phased verification protocols that address your security concerns.' },
          { speaker: 'ai', name: 'Min. Chen', text: 'Phased timelines have failed before. What specific mechanism guarantees compliance in the interim?' },
          { speaker: 'student', name: 'Priya', text: 'A joint monitoring commission with equal representation and real-time data sharing.' },
          { speaker: 'ai', name: 'Min. Chen', text: "Equal representation assumes symmetric trust we don't yet have. Who arbitrates disputes?" },
        ],
      },
      { name: 'Marcus T.', initials: 'MT', avatar: 'bg-purple-100 text-purple-700', turns: [
        { speaker: 'student', name: 'Marcus', text: 'We can offer economic incentives alongside phased disarmament.' },
        { speaker: 'ai', name: 'Min. Chen', text: "Economic incentives won't substitute for sovereign security guarantees." },
      ]},
      { name: 'Sofia L.', initials: 'SL', avatar: 'bg-teal-100 text-teal-700', turns: [] },
      { name: 'James W.', initials: 'JW', avatar: 'bg-amber-100 text-amber-700', turns: [
        { speaker: 'student', name: 'James', text: 'Our domestic coalition requires visible concessions before we can proceed further.' },
        { speaker: 'ai', name: 'Min. Chen', text: 'So does ours. Who moves first, and what guarantees do we have?' },
      ]},
    ],
  },
  {
    type: 'scenario_multi',
    label: 'Scenario Multi',
    badge: 'bg-indigo-100 text-indigo-700',
    accent: 'text-indigo-600',
    bar: 'from-indigo-400 to-indigo-500',
    bubble: 'bg-indigo-600 text-white',
    title: 'Urban Rezoning Town Hall',
    prompt: 'You are a concerned resident. Three stakeholders are present.',
    meta: 'Open turns · 3 personas',
    code: 'LM8P3X',
    isScenario: true,
    students: [
      {
        name: 'Priya K.', initials: 'PK', avatar: 'bg-blue-100 text-blue-700',
        turns: [
          { speaker: 'student', name: 'Priya', text: 'Increased density will fundamentally change the neighbourhood character long-term residents value.' },
          { speaker: 'ai', name: 'Developer', text: "Character and housing supply aren't mutually exclusive. Our design preserves the streetscape." },
          { speaker: 'student', name: 'Priya', text: 'Who bears the infrastructure cost of 400 additional units?' },
          { speaker: 'ai', name: 'City Planner', text: 'Council levies cover trunk infrastructure. Local street upgrades are assessed separately.' },
        ],
      },
      { name: 'Marcus T.', initials: 'MT', avatar: 'bg-purple-100 text-purple-700', turns: [
        { speaker: 'student', name: 'Marcus', text: 'The traffic impact study has significant gaps in peak-hour modelling.' },
        { speaker: 'ai', name: 'City Planner', text: "The study meets statutory requirements. Please specify which methodology you're questioning." },
      ]},
      { name: 'Sofia L.', initials: 'SL', avatar: 'bg-teal-100 text-teal-700', turns: [] },
      { name: 'Aisha M.', initials: 'AM', avatar: 'bg-rose-100 text-rose-700', turns: [
        { speaker: 'student', name: 'Aisha', text: 'Affordable units must be genuinely affordable — not just defined that way on paper.' },
        { speaker: 'ai', name: 'Developer', text: "We're at 20% below market rate. Define \"genuinely\" with a number." },
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
  const [sceneIdx, setSceneIdx] = useState(0)
  const [joined, setJoined] = useState(0)
  const [responded, setResponded] = useState(0)
  const [cursor, setCursor] = useState({ x: 415, y: 26 })
  const [clicking, setClicking] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [visibleTurns, setVisibleTurns] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return

    // Reset for new scene
    setJoined(0)
    setResponded(0)
    setCursor({ x: 415, y: 26 })
    setClicking(false)
    setExpandedIdx(null)
    setVisibleTurns(0)

    const T: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => T.push(setTimeout(fn, ms))
    const click = (ms: number) => {
      at(ms, () => setClicking(true))
      at(ms + 170, () => setClicking(false))
    }

    const sc = SCENES[sceneIdx]
    const n = sc.students.length

    // Phase 1: Students join one by one
    for (let i = 0; i < n; i++) {
      at(200 + i * 240, () => setJoined((j) => j + 1))
    }
    const joinedAt = 200 + n * 240

    if (!sc.isScenario) {
      // Phase 2: Cursor drifts over the student grid
      at(joinedAt - 100, () => setCursor({ x: 200, y: 180 }))
      at(joinedAt + 300, () => setCursor({ x: 200, y: 215 }))

      // Phase 3: Responses appear one by one
      const withContent = sc.students.filter((s) => s.response || s.aiLabel)
      for (let i = 0; i < withContent.length; i++) {
        at(joinedAt + 400 + i * 370, () => setResponded((r) => r + 1))
      }
      const respondedAt = joinedAt + 400 + withContent.length * 370

      // Phase 4: Cursor to AI Debrief button, click
      at(respondedAt + 150, () => setCursor({ x: 68, y: 348 }))
      click(respondedAt + 650)

      // Advance to next scene
      at(respondedAt + 1450, () => setSceneIdx((i) => (i + 1) % SCENES.length))
    } else {
      // Find student with most turns (richest chat)
      let richIdx = 0
      sc.students.forEach((s, i) => {
        if ((s.turns?.length ?? 0) > (sc.students[richIdx]?.turns?.length ?? 0)) richIdx = i
      })

      // Phase 2: Cursor moves to first participant card, clicks to expand
      at(joinedAt + 100, () => setCursor({ x: 240, y: 162 }))
      click(joinedAt + 550)
      at(joinedAt + 600, () => setExpandedIdx(richIdx))

      // Phase 3: Chat turns appear one by one
      const turns = sc.students[richIdx]?.turns ?? []
      for (let i = 0; i < turns.length; i++) {
        at(joinedAt + 950 + i * 560, () => setVisibleTurns((t) => t + 1))
      }
      const chatAt = joinedAt + 950 + turns.length * 560

      // Phase 4: Cursor to Evaluate All button, click
      at(chatAt + 200, () => setCursor({ x: 68, y: 348 }))
      click(chatAt + 650)

      // Advance to next scene
      at(chatAt + 1450, () => setSceneIdx((i) => (i + 1) % SCENES.length))
    }

    return () => T.forEach(clearTimeout)
  }, [sceneIdx, paused])

  const sc = SCENES[sceneIdx]
  const displayStudents = sc.students.slice(0, joined)

  // For round-based: map `responded` counter onto students-with-content
  let contentSeen = 0
  const displayData = displayStudents.map((s) => {
    const hasContent = !!(s.response || s.aiLabel)
    let showContent = false
    if (hasContent) {
      contentSeen++
      showContent = contentSeen <= responded
    }
    return { ...s, showContent }
  })

  const submittedCount = sc.isScenario
    ? displayStudents.filter((s) => (s.turns?.length ?? 0) > 0).length
    : displayData.filter((d) => d.showContent).length

  const pct = displayStudents.length > 0
    ? Math.round((submittedCount / displayStudents.length) * 100)
    : 0

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Demo window */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden">

        {/* Fake browser chrome */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border-b border-slate-100">
          <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
          <div className="flex-1 mx-2">
            <div className="bg-white border border-slate-100 rounded px-2 py-0.5 text-[10px] text-slate-400 font-mono text-center">
              app.kiln.education/instructor/session
            </div>
          </div>
        </div>

        {/* Activity header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full transition-colors duration-500 ${sc.badge}`}>
            {sc.label}
          </span>
          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
            {sc.code}
          </span>
        </div>

        {/* Session info */}
        <div className="px-4 pt-3 pb-2.5">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm font-bold text-slate-900 leading-tight transition-all duration-300">{sc.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic">{sc.prompt}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-base font-bold leading-tight ${sc.accent}`}>
                {submittedCount}<span className="text-slate-400 font-normal text-sm">/{displayStudents.length || sc.students.length}</span>
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

        {/* Student area */}
        <div className="px-4 pb-2 min-h-[148px]">
          {sc.isScenario ? (
            // Scenario: collapsible participant rows
            <div className="flex flex-col gap-1.5">
              {displayStudents.map((s, i) => {
                const isExp = expandedIdx === i
                const studentTurns = s.turns?.filter((t) => t.speaker === 'student').length ?? 0
                const shownTurns = isExp ? (s.turns ?? []).slice(0, visibleTurns) : []
                const hasTurns = (s.turns?.length ?? 0) > 0
                return (
                  <div
                    key={s.name}
                    className={`rounded-xl border overflow-hidden transition-all duration-300 ${
                      isExp ? 'border-slate-300 shadow-sm bg-slate-50/60' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 px-3 py-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${s.avatar}`}>
                        {s.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800">{s.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-14 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${sc.bar} rounded-full transition-all duration-700`}
                              style={{ width: `${Math.min(100, (studentTurns / 4) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-400">{studentTurns} turns</span>
                        </div>
                      </div>
                      {hasTurns && (
                        isExp
                          ? <ChevronUp className="w-3 h-3 text-slate-400 shrink-0" />
                          : <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                    </div>
                    {isExp && shownTurns.length > 0 && (
                      <div className="px-3 pb-3 flex flex-col gap-1.5 max-h-[130px] overflow-hidden">
                        {shownTurns.map((t, ti) => (
                          <div key={ti} className={`flex ${t.speaker === 'ai' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`text-[10px] px-2.5 py-1.5 rounded-xl max-w-[80%] leading-relaxed ${
                              t.speaker === 'student'
                                ? 'bg-white border border-slate-200 text-slate-700'
                                : sc.bubble
                            }`}>
                              {t.speaker === 'ai' && (
                                <span className="block font-bold opacity-80 text-[9px] mb-0.5">{t.name}</span>
                              )}
                              {t.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            // Round-based: 2-column student grid
            <div className="grid grid-cols-2 gap-2">
              {displayData.map((s) => {
                const hasContent = !!(s.response || s.aiLabel)
                return (
                  <div
                    key={s.name}
                    className={`rounded-xl border p-2 transition-all duration-300 ${
                      s.showContent
                        ? 'border-emerald-200 bg-white'
                        : hasContent
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-slate-100 bg-slate-50/50'
                    }`}
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
                      ) : hasContent ? (
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
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/40">
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
      </div>

      {/* Animated cursor */}
      <div
        className="absolute pointer-events-none z-10"
        style={{
          left: `${cursor.x}px`,
          top: `${cursor.y}px`,
          transition: 'left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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
