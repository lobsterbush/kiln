import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { ActivityType, MediaType } from '../lib/types'
import type { ActivityTemplate } from '../lib/templates'
import { Users, BookOpen, HelpCircle, BarChart2, Zap, User, UsersRound, Plus, Trash2 } from 'lucide-react'
import { MediaUpload } from '../components/shared/MediaUpload'

interface Template {
  label: string
  title: string
  prompt: string
  objectives?: string
}

const PEER_CRITIQUE_TEMPLATES: Template[] = [
  {
    label: 'Policy debate',
    title: 'Policy Debate',
    prompt: 'What is the strongest argument in favor of the policy we discussed today? State your position and the single best piece of evidence for it.',
  },
  {
    label: 'Causal claim',
    title: 'Causal Argument',
    prompt: 'Identify the primary cause of the phenomenon discussed in today\'s reading. Make a clear causal claim and explain the mechanism.',
  },
  {
    label: 'Normative stance',
    title: 'Normative Position',
    prompt: 'Take a position on the ethical question raised in class today. Defend your stance with a principled argument.',
  },
]

const SOCRATIC_CHAIN_TEMPLATES: Template[] = [
  {
    label: 'Explain a concept',
    title: 'Concept Check',
    prompt: 'In your own words, explain the key concept from today\'s lecture. What does it mean and why does it matter?',
    objectives: 'Demonstrate understanding of the core concept\nConnect concept to course themes\nIdentify implications or applications',
  },
  {
    label: 'Evaluate evidence',
    title: 'Evidence Evaluation',
    prompt: 'What do you see as the strongest evidence from the assigned reading? Why is this evidence compelling?',
    objectives: 'Distinguish strong from weak evidence\nExplain standards of evaluation\nIdentify potential counterevidence',
  },
  {
    label: 'Apply theory',
    title: 'Theory Application',
    prompt: 'Apply the theoretical framework from class to a real-world case of your choice. What does the theory predict and why?',
    objectives: 'Identify observable implications of the theory\nMatch theory to empirical patterns\nRecognize scope conditions',
  },
]

const PEER_CLARIFICATION_TEMPLATES: Template[] = [
  {
    label: 'Muddy point',
    title: 'Muddy Point',
    prompt: 'What is the single most confusing point from today\'s material? Describe your confusion precisely — what exactly are you unsure about?',
  },
  {
    label: 'Lecture gap',
    title: 'Lecture Gap',
    prompt: 'Identify a concept from today\'s lecture that you don\'t yet understand well enough to explain to someone else. What specifically is unclear?',
  },
]

const EVIDENCE_ANALYSIS_TEMPLATES: Template[] = [
  {
    label: 'Interpret a statistic',
    title: 'Data Interpretation',
    prompt: 'What does this figure tell us? What does it not tell us? (Attach an image, chart, or paste data before starting the session.)',
  },
  {
    label: 'Analyse a quote',
    title: 'Source Analysis',
    prompt: 'What is the author claiming? What evidence supports or undermines this claim? (Paste your quote or attach a document before starting the session.)',
  },
  {
    label: 'Analyse an image',
    title: 'Image Analysis',
    prompt: 'Examine the image carefully. What does it show? What claim or argument could you build from this evidence alone?',
  },
]

interface ScenarioPersonaForm { name: string; role: string; goals: string; personality: string }

const SCENARIO_SOLO_TEMPLATES = [
  {
    label: 'Trade negotiation',
    title: 'Bilateral Trade Negotiation',
    scenario: 'A two-day ministerial meeting between your country and a rival trading partner. Both sides are under domestic pressure. A deal must be reached by end of day.',
    studentRole: 'Trade Minister for a developing economy seeking tariff reductions on agricultural exports',
    personas: [{ name: 'Ambassador Chen', role: 'Senior Trade Negotiator for a major industrial power', goals: 'Protect domestic manufacturing jobs while securing market access for tech exports. Willing to concede on agriculture only if IP protections are guaranteed.', personality: 'Measured, highly experienced, strategically patient' }],
    prompt: 'Open the negotiation. State your opening position.',
  },
  {
    label: 'Crisis press conference',
    title: 'Crisis Communications',
    scenario: 'Your company has just been implicated in a data breach affecting 2 million users. A press conference begins in 30 seconds.',
    studentRole: 'Chief Communications Officer facing a hostile press corps',
    personas: [{ name: 'Reporter Sarah Kim', role: 'Investigative journalist from a major national paper', goals: 'Get the company to admit fault, reveal the scope of the breach, and name the executives responsible.', personality: 'Aggressive, well-prepared, not easily deflected' }],
    prompt: 'The press conference begins. Give your opening statement.',
  },
  {
    label: 'Witness examination',
    title: 'Cross-Examination',
    scenario: 'A civil trial. The witness has testified in chief that they clearly saw the defendant near the scene. You are about to cross-examine.',
    studentRole: 'Defense attorney conducting cross-examination',
    personas: [{ name: 'Witness James Holloway', role: 'Prosecution witness and neighbor of the defendant', goals: 'Maintain his account of events. He genuinely believes what he saw but has some inconsistencies in prior statements.', personality: 'Nervous but earnest, becomes more defensive when pressed' }],
    prompt: 'Begin your cross-examination.',
  },
]

const SCENARIO_MULTI_TEMPLATES = [
  {
    label: 'UN Security Council',
    title: 'UN Security Council Emergency Session',
    scenario: 'An emergency UNSC session convened following a cross-border military incident. A resolution must be drafted within the hour. Each permanent member has competing interests.',
    studentRole: 'UK Permanent Representative chairing the session',
    personas: [
      { name: 'Ambassador Volkov (Russia)', role: 'Russian Permanent Representative', goals: 'Block any resolution condemning the incident. Propose an independent investigation under Russian co-chairing.', personality: 'Forceful, dismissive of procedural arguments, skilled at procedural delay' },
      { name: 'Ambassador Zhang (China)', role: 'Chinese Permanent Representative', goals: 'Avoid precedent-setting language on sovereignty violations. Prefers non-binding language.', personality: 'Formal, non-committal, speaks rarely but precisely' },
      { name: 'Ambassador Moreau (France)', role: 'French Permanent Representative', goals: 'Support a binding resolution but willing to compromise on timeline and scope.', personality: 'Diplomatic, pragmatic, concerned about European unity' },
    ],
    prompt: 'Call the session to order and introduce the draft resolution.',
  },
  {
    label: 'Hospital ethics committee',
    title: 'Medical Ethics Committee',
    scenario: 'A 16-year-old patient refuses a blood transfusion on religious grounds. Without it, there is a 70% chance of death. The parents agree with the refusal. The attending physician has requested an ethics committee review.',
    studentRole: 'Ethics committee chair facilitating the deliberation',
    personas: [
      { name: 'Dr. Osei (Attending)', role: 'Attending physician', goals: 'Save the patient\'s life. Believes mature minor doctrine may apply but is unsure.', personality: 'Direct, medically focused, visibly distressed' },
      { name: 'Dr. Reeves (Ethicist)', role: 'Hospital ethicist', goals: 'Ensure the process respects patient autonomy while considering capacity carefully.', personality: 'Precise, Socratic, challenges assumptions' },
      { name: 'Legal Counsel (Torres)', role: 'Hospital legal counsel', goals: 'Protect the institution from liability. Wants a documented decision trail.', personality: 'Cautious, risk-averse, focuses on precedent' },
    ],
    prompt: 'Open the committee deliberation.',
  },
  {
    label: 'Board crisis meeting',
    title: 'Board of Directors Crisis',
    scenario: 'An emergency board meeting after a whistleblower report alleging financial fraud by the CFO. Shareholders are calling for immediate action. The CEO denies knowledge.',
    studentRole: 'Independent board director chairing the emergency meeting',
    personas: [
      { name: 'CEO Harrington', role: 'Founder and CEO', goals: 'Protect the company and their own reputation. Claims total ignorance of the fraud.', personality: 'Defensive but charismatic, skilled at deflection' },
      { name: 'Lead Investor (Park)', role: 'Largest institutional shareholder', goals: 'Immediate CFO removal and independent audit. Threatening to go public.', personality: 'Impatient, metrics-driven, does not trust the CEO' },
      { name: 'General Counsel (Diaz)', role: 'Company general counsel', goals: 'Limit legal exposure. Recommends controlled disclosure and internal investigation.', personality: 'Methodical, cautious, avoids taking sides' },
    ],
    prompt: 'Open the emergency meeting.',
  },
]

export function CreateActivity() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const incomingTemplate = (location.state as { template?: ActivityTemplate } | null)?.template

  useEffect(() => {
    if (!authLoading && !user) navigate('/instructor')
  }, [user, authLoading, navigate])

  const [type, setType] = useState<ActivityType | null>(incomingTemplate?.type ?? null)
  const [title, setTitle] = useState(incomingTemplate?.title ?? '')
  const [prompt, setPrompt] = useState(incomingTemplate?.config.initial_prompt ?? '')
  const [rounds, setRounds] = useState(incomingTemplate?.config.rounds ?? 3)
  const [duration, setDuration] = useState(incomingTemplate?.config.round_duration_sec ?? 90)
  const [objectives, setObjectives] = useState(incomingTemplate?.config.learning_objectives?.join('\n') ?? '')
  const [sourceMaterial, setSourceMaterial] = useState(incomingTemplate?.config.source_material ?? '')
  const [critiquePrompt, setCritiquePrompt] = useState(incomingTemplate?.config.critique_prompt ?? '')
  const [rebuttalPrompt, setRebuttalPrompt] = useState(incomingTemplate?.config.rebuttal_prompt ?? '')
  const [explainPrompt, setExplainPrompt] = useState(incomingTemplate?.config.explain_prompt ?? '')
  const [gapPrompt, setGapPrompt] = useState(incomingTemplate?.config.gap_prompt ?? '')
  const [autoAdvance, setAutoAdvance] = useState(incomingTemplate?.config.auto_advance ?? false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // Scenario fields
  const [scenarioContext, setScenarioContext] = useState(incomingTemplate?.config.scenario_context ?? '')
  const [studentRole, setStudentRole] = useState(incomingTemplate?.config.student_role ?? '')
  const [scenarioPersonas, setScenarioPersonas] = useState<ScenarioPersonaForm[]>(
    incomingTemplate?.config.ai_personas?.map((p) => ({ name: p.name, role: p.role, goals: p.goals, personality: p.personality ?? '' })) ??
    [{ name: '', role: '', goals: '', personality: '' }]
  )
  const [maxTurns, setMaxTurns] = useState(incomingTemplate?.config.max_turns ?? 8)
  const [evaluationRubric, setEvaluationRubric] = useState(
    incomingTemplate?.config.evaluation_rubric?.join('\n') ?? 'reasoning\ncommunication\nevidence\nethics'
  )
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(incomingTemplate?.config.media_url)
  const [mediaType, setMediaType] = useState<MediaType | undefined>(incomingTemplate?.config.media_type)

  if (authLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Loading...</div>
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !type || !title.trim() || !prompt.trim()) return

    setSaving(true)
    setSaveError(null)
    const isScenario = type === 'scenario_solo' || type === 'scenario_multi'
    const { error } = await supabase.from('activities').insert({
      instructor_id: user.id,
      title: title.trim(),
      type,
      config: {
        rounds: isScenario ? 1 : rounds,
        round_duration_sec: isScenario ? 3600 : duration,
        initial_prompt: prompt.trim(),
        learning_objectives: objectives
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        ...(type === 'socratic_chain' && sourceMaterial.trim() && { source_material: sourceMaterial.trim() }),
        ...(type === 'peer_critique' && critiquePrompt.trim() && { critique_prompt: critiquePrompt.trim() }),
        ...(type === 'peer_critique' && rebuttalPrompt.trim() && { rebuttal_prompt: rebuttalPrompt.trim() }),
        ...(type === 'peer_clarification' && explainPrompt.trim() && { explain_prompt: explainPrompt.trim() }),
        ...(type === 'evidence_analysis' && gapPrompt.trim() && { gap_prompt: gapPrompt.trim() }),
        ...(autoAdvance && { auto_advance: true }),
        ...(isScenario && {
          scenario_context: scenarioContext.trim(),
          student_role: studentRole.trim(),
          ai_personas: scenarioPersonas.filter((p) => p.name.trim() && p.role.trim()),
          max_turns: maxTurns,
          evaluation_rubric: evaluationRubric.split('\n').map((s) => s.trim()).filter(Boolean),
        }),
        ...(mediaUrl && { media_url: mediaUrl, media_type: mediaType }),
      },
    })

    if (error) {
      setSaveError('Failed to create activity. Please try again.')
      setSaving(false)
      return
    }

    navigate('/instructor')
  }

  function applyScenarioTemplate(t: typeof SCENARIO_SOLO_TEMPLATES[0]) {
    setTitle(t.title)
    setPrompt(t.prompt)
    setScenarioContext(t.scenario)
    setStudentRole(t.studentRole)
    setScenarioPersonas(t.personas.map((p) => ({ ...p, personality: p.personality ?? '' })))
  }

  // Step 1: Choose type
  if (!type) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Activity</h1>
        <p className="text-sm text-slate-500 mb-8">Choose an activity type to get started.</p>
        <div className="flex flex-col gap-4 stagger-children">
          <button
            onClick={() => { setType('peer_critique'); setRounds(3) }}
            className="group flex items-center gap-5 p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors shrink-0">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Peer Critique</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Students write claims, critique each other's arguments, and respond to criticism in timed rounds.
              </p>
            </div>
          </button>
          <button
            onClick={() => { setType('socratic_chain'); setRounds(3) }}
            className="group flex items-center gap-5 p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-purple-400 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors shrink-0">
              <BookOpen className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Socratic Chain</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                AI generates personalized follow-up questions that probe each student's reasoning.
              </p>
            </div>
          </button>
          <button
            onClick={() => { setType('peer_clarification'); setRounds(2) }}
            className="group flex items-center gap-5 p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-teal-400 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="p-3 bg-teal-50 rounded-xl group-hover:bg-teal-100 transition-colors shrink-0">
              <HelpCircle className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Peer Clarification</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Students surface their own confusion; then explain a classmate's confusion in plain language.
              </p>
            </div>
          </button>
          <button
            onClick={() => { setType('evidence_analysis'); setRounds(2) }}
            className="group flex items-center gap-5 p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-cyan-400 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="p-3 bg-cyan-50 rounded-xl group-hover:bg-cyan-100 transition-colors shrink-0">
              <BarChart2 className="w-7 h-7 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Evidence Analysis</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Students interpret a piece of evidence revealed live; then find the inferential gap in a peer's reading.
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scenario Simulations</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button
            onClick={() => { setType('scenario_solo'); setScenarioPersonas([{ name: '', role: '', goals: '', personality: '' }]) }}
            className="group flex items-center gap-5 p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-rose-400 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="p-3 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition-colors shrink-0">
              <User className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Scenario Solo</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Each student negotiates, argues, or cross-examines a single AI-driven counterpart in a customisable role-play scenario.
              </p>
            </div>
          </button>

          <button
            onClick={() => { setType('scenario_multi'); setScenarioPersonas([{ name: '', role: '', goals: '', personality: '' }, { name: '', role: '', goals: '', personality: '' }]) }}
            className="group flex items-center gap-5 p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors shrink-0">
              <UsersRound className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Scenario Multi</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Students navigate a room of 2–4 AI-driven stakeholders with competing interests — a war game, ethics committee, boardroom, or diplomacy scenario.
              </p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  const isScenarioType = type === 'scenario_solo' || type === 'scenario_multi'
  const templates =
    type === 'peer_critique' ? PEER_CRITIQUE_TEMPLATES :
    type === 'socratic_chain' ? SOCRATIC_CHAIN_TEMPLATES :
    type === 'peer_clarification' ? PEER_CLARIFICATION_TEMPLATES :
    type === 'scenario_solo' ? [] :
    type === 'scenario_multi' ? [] :
    EVIDENCE_ANALYSIS_TEMPLATES
  const scenarioTemplates = type === 'scenario_solo' ? SCENARIO_SOLO_TEMPLATES : SCENARIO_MULTI_TEMPLATES

  function applyTemplate(t: Template) {
    setTitle(t.title)
    setPrompt(t.prompt)
    if (t.objectives) setObjectives(t.objectives)
  }

  // Step 2: Configure
  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        {type === 'peer_critique' ? 'Peer Critique' :
         type === 'socratic_chain' ? 'Socratic Chain' :
         type === 'peer_clarification' ? 'Peer Clarification' :
         type === 'scenario_solo' ? 'Scenario Solo' :
         type === 'scenario_multi' ? 'Scenario Multi' :
         'Evidence Analysis'}
      </h1>
      <button
        onClick={() => setType(null)}
        className="text-sm text-slate-500 hover:text-kiln-600 mb-6 transition-colors"
      >
        ← Change type
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3.5 h-3.5 text-kiln-500" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick start</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {isScenarioType
            ? scenarioTemplates.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => applyScenarioTemplate(t)}
                  className="px-3 py-1.5 text-sm bg-kiln-50 text-kiln-700 rounded-full border border-kiln-200 hover:bg-kiln-100 hover:border-kiln-300 transition-colors font-medium"
                >
                  {t.label}
                </button>
              ))
            : templates.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="px-3 py-1.5 text-sm bg-kiln-50 text-kiln-700 rounded-full border border-kiln-200 hover:bg-kiln-100 hover:border-kiln-300 transition-colors font-medium"
                >
                  {t.label}
                </button>
              ))
          }
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Activity Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Democratic Backsliding Debate"
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
          />
        </div>

        {isScenarioType && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Scenario Context</label>
              <textarea
                value={scenarioContext}
                onChange={(e) => setScenarioContext(e.target.value)}
                placeholder="Describe the setting, stakes, and background. Students will see this before they begin."
                className="w-full h-32 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors leading-relaxed text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Student's Role</label>
              <input
                type="text"
                value={studentRole}
                onChange={(e) => setStudentRole(e.target.value)}
                placeholder="e.g., Defense attorney, Trade Minister, Ethics committee chair"
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {type === 'scenario_solo' ? 'AI Counterpart' : 'AI Stakeholders'}
              </label>
              <div className="flex flex-col gap-4">
                {scenarioPersonas.map((persona, i) => (
                  <div key={i} className="border-2 border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {type === 'scenario_solo' ? 'Counterpart' : `Stakeholder ${i + 1}`}
                      </span>
                      {type === 'scenario_multi' && scenarioPersonas.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setScenarioPersonas((prev) => prev.filter((_, j) => j !== i))}
                          className="text-slate-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={persona.name}
                      onChange={(e) => setScenarioPersonas((prev) => prev.map((p, j) => j === i ? { ...p, name: e.target.value } : p))}
                      placeholder="Name (e.g., Ambassador Chen, Dr. Reeves)"
                      className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-kiln-400 transition-colors"
                    />
                    <input
                      type="text"
                      value={persona.role}
                      onChange={(e) => setScenarioPersonas((prev) => prev.map((p, j) => j === i ? { ...p, role: e.target.value } : p))}
                      placeholder="Role (e.g., Senior Trade Negotiator)"
                      className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-kiln-400 transition-colors"
                    />
                    <textarea
                      value={persona.goals}
                      onChange={(e) => setScenarioPersonas((prev) => prev.map((p, j) => j === i ? { ...p, goals: e.target.value } : p))}
                      placeholder="Goals and interests — what does this stakeholder want? What are their constraints?"
                      rows={2}
                      className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl resize-none text-sm focus:outline-none focus:border-kiln-400 transition-colors"
                    />
                    <input
                      type="text"
                      value={persona.personality}
                      onChange={(e) => setScenarioPersonas((prev) => prev.map((p, j) => j === i ? { ...p, personality: e.target.value } : p))}
                      placeholder="Personality style (optional — e.g., Measured and patient, Aggressive)"
                      className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-kiln-400 transition-colors"
                    />
                  </div>
                ))}
                {type === 'scenario_multi' && scenarioPersonas.length < 4 && (
                  <button
                    type="button"
                    onClick={() => setScenarioPersonas((prev) => [...prev, { name: '', role: '', goals: '', personality: '' }])}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-kiln-300 hover:text-kiln-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add stakeholder
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Opening Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What does the student say or do to open the simulation? e.g., 'Begin your cross-examination.' or 'Open the negotiation.'"
                className="w-full h-24 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors leading-relaxed text-sm"
              />
              <p className="text-xs text-slate-400 mt-1.5">Shown to students as an instruction before they type their first message.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Max turns per student</label>
                <select
                  value={maxTurns}
                  onChange={(e) => setMaxTurns(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
                >
                  {[4, 6, 8, 10, 12].map((n) => (
                    <option key={n} value={n}>{n} turns</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Evaluation rubric <span className="normal-case font-normal text-slate-400">(one per line)</span>
                </label>
                <textarea
                  value={evaluationRubric}
                  onChange={(e) => setEvaluationRubric(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors text-sm"
                />
              </div>
            </div>
          </>
        )}

        {!isScenarioType && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {type === 'peer_critique' ? 'Opening Prompt' :
               type === 'peer_clarification' ? 'Confusion Prompt' :
               type === 'evidence_analysis' ? 'Evidence & Interpretation Prompt' :
               'Initial Question'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                type === 'peer_critique'
                  ? 'What is the strongest argument for X?'
                  : 'What explains democratic backsliding in Hungary?'
              }
              className="w-full h-32 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors leading-relaxed"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Learning Objectives{' '}
            <span className="normal-case font-normal text-slate-400">(optional — one per line)</span>
          </label>
          <textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder={type === 'socratic_chain'
              ? 'Evaluate institutional vs cultural explanations\nIdentify necessary vs sufficient conditions'
              : type === 'peer_critique'
              ? 'Construct a well-evidenced argument\nIdentify weaknesses in reasoning\nRespond to critique under time pressure'
              : type === 'peer_clarification'
              ? 'Diagnose gaps in your own understanding\nExplain a concept in plain language'
              : 'Interpret unfamiliar evidence cold\nIdentify inferential gaps in peer reasoning'
            }
            className="w-full h-24 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors"
          />
          <p className="text-xs text-slate-400 mt-1.5">Used by AI to generate more targeted student feedback.</p>
        </div>

        {type === 'socratic_chain' && (
          <div className="flex flex-col gap-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Source Material{' '}
              <span className="normal-case font-normal text-slate-400">(optional — paste readings, lecture notes, or key excerpts)</span>
            </label>
            <p className="text-xs text-slate-400 leading-relaxed">
              Claude will use this to generate follow-up questions grounded in your specific material. Paste the most relevant 1–3 paragraphs for best results.
            </p>
            <textarea
              value={sourceMaterial}
              onChange={(e) => setSourceMaterial(e.target.value)}
              placeholder="Paste a reading excerpt, key argument, lecture notes, or any text you want follow-up questions to engage with..."
              className="w-full h-40 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors leading-relaxed text-sm"
            />
            {sourceMaterial.length > 3000 && (
              <p className="text-xs text-cyan-600">Long passages will be trimmed to ~3,000 characters. Consider pasting the most relevant excerpt.</p>
            )}
          </div>
        )}

        {type === 'peer_critique' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Critique Prompt{' '}
                <span className="normal-case font-normal text-slate-400">(optional — leave blank for default)</span>
              </label>
              <textarea
                value={critiquePrompt}
                onChange={(e) => setCritiquePrompt(e.target.value)}
                placeholder="Read the argument below carefully. Identify its weakest assumption or unsupported claim."
                className="w-full h-24 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Rebuttal Prompt{' '}
                <span className="normal-case font-normal text-slate-400">(optional — leave blank for default)</span>
              </label>
              <textarea
                value={rebuttalPrompt}
                onChange={(e) => setRebuttalPrompt(e.target.value)}
                placeholder="Below is a peer's critique of your original argument. Write a rebuttal defending your position."
                className="w-full h-24 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors leading-relaxed"
              />
            </div>
          </>
        )}

        {type === 'peer_clarification' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Explanation Prompt{' '}
              <span className="normal-case font-normal text-slate-400">(optional — leave blank for default)</span>
            </label>
            <textarea
              value={explainPrompt}
              onChange={(e) => setExplainPrompt(e.target.value)}
              placeholder="A classmate shared their confusion below. Explain this concept to them in plain language."
              className="w-full h-24 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors leading-relaxed"
            />
          </div>
        )}

        {type === 'evidence_analysis' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Gap Identification Prompt{' '}
              <span className="normal-case font-normal text-slate-400">(optional — leave blank for default)</span>
            </label>
            <textarea
              value={gapPrompt}
              onChange={(e) => setGapPrompt(e.target.value)}
              placeholder="Read your classmate's interpretation below. What is the biggest inferential gap in their reasoning?"
              className="w-full h-24 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors leading-relaxed"
            />
          </div>
        )}

        {!isScenarioType && (<>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Rounds</label>
            {(type === 'peer_clarification' || type === 'evidence_analysis') ? (
              <div className="px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-500">
                2 rounds (fixed)
              </div>
            ) : (
              <select
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
              >
                {(type === 'peer_critique' ? [2, 3] : [2, 3, 4, 5]).map((n) => (
                  <option key={n} value={n}>
                    {n === 2 && type === 'peer_critique' ? '2 — Claim + Critique'
                      : n === 3 && type === 'peer_critique' ? '3 — Claim + Critique + Rebuttal'
                      : `${n} rounds`}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Time per Round</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
            >
              {[
                [30, '30 sec'],
                [60, '1 min'],
                [90, '90 sec'],
                [120, '2 min'],
                [300, '5 min'],
                [600, '10 min'],
                [900, '15 min'],
                [1800, '30 min — take-home'],
                [3600, '60 min — async'],
              ].map(([s, label]) => (
                <option key={s} value={s}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Estimated total time */}
        <p className="text-xs text-slate-400">
          Estimated class time: <span className="font-semibold text-slate-500">
            {(() => { const totalSec = rounds * duration; const totalMin = Math.round(totalSec / 60); return totalMin < 1 ? `${totalSec}s` : totalMin < 60 ? `~${totalMin} min` : `~${(totalMin / 60).toFixed(1)} hr` })()}
          </span>
          <span className="text-slate-300 ml-1">({rounds} round{rounds !== 1 ? 's' : ''} × {duration < 60 ? `${duration}s` : `${Math.round(duration / 60)}min`})</span>
        </p>

        {/* Auto-advance toggle */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-700">Auto-advance rounds</p>
            <p className="text-xs text-slate-400 mt-0.5">Move to the next round automatically when the timer expires</p>
          </div>
          <button
            type="button"
            onClick={() => setAutoAdvance((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${
              autoAdvance ? 'bg-kiln-500' : 'bg-slate-300'
            }`}
            aria-label="Toggle auto-advance"
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              autoAdvance ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
        </>)}

        {/* Media upload — available for all activity types */}
        {user && (
          <MediaUpload
            instructorId={user.id}
            mediaUrl={mediaUrl}
            mediaType={mediaType}
            onChange={(url, mt) => { setMediaUrl(url); setMediaType(mt) }}
          />
        )}

        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{saveError}</p>
        )}

        <button
          type="submit"
          disabled={saving || !title.trim() || !prompt.trim()}
          className="px-6 py-3.5 bg-kiln-600 text-white font-semibold rounded-xl hover:bg-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {saving ? 'Creating...' : 'Create Activity'}
        </button>
      </form>
    </div>
  )
}
