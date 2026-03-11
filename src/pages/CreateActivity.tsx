import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { ActivityType } from '../lib/types'
import { Users, BookOpen, Zap } from 'lucide-react'

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

export function CreateActivity() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !user) navigate('/instructor')
  }, [user, authLoading, navigate])

  const [type, setType] = useState<ActivityType | null>(null)
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [rounds, setRounds] = useState(3)
  const [duration, setDuration] = useState(90)
  const [objectives, setObjectives] = useState('')
  const [critiquePrompt, setCritiquePrompt] = useState('')
  const [rebuttalPrompt, setRebuttalPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (authLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Loading...</div>
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !type || !title.trim() || !prompt.trim()) return

    setSaving(true)
    setSaveError(null)
    const { error } = await supabase.from('activities').insert({
      instructor_id: user.id,
      title: title.trim(),
      type,
      config: {
        rounds,
        round_duration_sec: duration,
        initial_prompt: prompt.trim(),
        learning_objectives: objectives
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        ...(type === 'peer_critique' && critiquePrompt.trim() && { critique_prompt: critiquePrompt.trim() }),
        ...(type === 'peer_critique' && rebuttalPrompt.trim() && { rebuttal_prompt: rebuttalPrompt.trim() }),
      },
    })

    if (error) {
      setSaveError('Failed to create activity. Please try again.')
      setSaving(false)
      return
    }

    navigate('/instructor')
  }

  // Step 1: Choose type
  if (!type) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Activity</h1>
        <p className="text-sm text-slate-500 mb-8">Choose an activity type to get started.</p>
        <div className="flex flex-col gap-4 stagger-children">
          <button
            onClick={() => setType('peer_critique')}
            className="group flex items-center gap-5 p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-kiln-400 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="p-3 bg-kiln-50 rounded-xl group-hover:bg-kiln-100 transition-colors shrink-0">
              <Users className="w-7 h-7 text-kiln-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Peer Critique</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Students write claims, critique each other's arguments, and respond to criticism in timed rounds.
              </p>
            </div>
          </button>
          <button
            onClick={() => setType('socratic_chain')}
            className="group flex items-center gap-5 p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-kiln-400 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="p-3 bg-kiln-50 rounded-xl group-hover:bg-kiln-100 transition-colors shrink-0">
              <BookOpen className="w-7 h-7 text-kiln-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Socratic Chain</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                AI generates personalized follow-up questions that probe each student's reasoning.
              </p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  const templates = type === 'peer_critique' ? PEER_CRITIQUE_TEMPLATES : SOCRATIC_CHAIN_TEMPLATES

  function applyTemplate(t: Template) {
    setTitle(t.title)
    setPrompt(t.prompt)
    if (t.objectives) setObjectives(t.objectives)
  }

  // Step 2: Configure
  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        {type === 'peer_critique' ? 'Peer Critique' : 'Socratic Chain'}
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
          {templates.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => applyTemplate(t)}
              className="px-3 py-1.5 text-sm bg-kiln-50 text-kiln-700 rounded-full border border-kiln-200 hover:bg-kiln-100 hover:border-kiln-300 transition-colors font-medium"
            >
              {t.label}
            </button>
          ))}
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

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {type === 'peer_critique' ? 'Opening Prompt' : 'Initial Question'}
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

        {type === 'socratic_chain' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Learning Objectives (one per line)
            </label>
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Evaluate institutional vs cultural explanations&#10;Identify necessary vs sufficient conditions"
              className="w-full h-24 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors"
            />
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Rounds</label>
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
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Time per Round</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
            >
              {[30, 45, 60, 90, 120].map((s) => (
                <option key={s} value={s}>{s === 30 ? '30 seconds (very short)' : `${s} seconds`}</option>
              ))}
            </select>
          </div>
        </div>

        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{saveError}</p>
        )}

        <button
          type="submit"
          disabled={saving || !title.trim() || !prompt.trim()}
          className="px-6 py-3.5 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white font-semibold rounded-xl hover:from-kiln-600 hover:to-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-kiln-200 active:scale-95"
        >
          {saving ? 'Creating...' : 'Create Activity'}
        </button>
      </form>
    </div>
  )
}
