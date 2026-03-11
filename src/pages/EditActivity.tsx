import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { Activity } from '../lib/types'

export function EditActivity() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [activity, setActivity] = useState<Activity | null>(null)
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [rounds, setRounds] = useState(3)
  const [duration, setDuration] = useState(90)
  const [objectives, setObjectives] = useState('')
  const [critiquePrompt, setCritiquePrompt] = useState('')
  const [rebuttalPrompt, setRebuttalPrompt] = useState('')
  const [explainPrompt, setExplainPrompt] = useState('')
  const [gapPrompt, setGapPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/instructor')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!id || !user) return
    loadActivity()
  }, [id, user])

  async function loadActivity() {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .eq('instructor_id', user!.id)
      .single()
    if (data) {
      setActivity(data)
      setTitle(data.title)
      setPrompt(data.config.initial_prompt)
      setRounds(data.config.rounds)
      setDuration(data.config.round_duration_sec)
      setObjectives(data.config.learning_objectives?.join('\n') ?? '')
      setCritiquePrompt(data.config.critique_prompt ?? '')
      setRebuttalPrompt(data.config.rebuttal_prompt ?? '')
      setExplainPrompt(data.config.explain_prompt ?? '')
      setGapPrompt(data.config.gap_prompt ?? '')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !activity || !title.trim() || !prompt.trim()) return
    setSaving(true)
    setSaveError(null)

    const { error } = await supabase
      .from('activities')
      .update({
        title: title.trim(),
        config: {
          ...activity.config,
          initial_prompt: prompt.trim(),
          rounds,
          round_duration_sec: duration,
          learning_objectives: objectives
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          ...(activity.type === 'peer_critique' && {
            critique_prompt: critiquePrompt.trim() || null,
            rebuttal_prompt: rebuttalPrompt.trim() || null,
          }),
          ...(activity.type === 'peer_clarification' && {
            explain_prompt: explainPrompt.trim() || null,
          }),
          ...(activity.type === 'evidence_analysis' && {
            gap_prompt: gapPrompt.trim() || null,
          }),
        },
      })
      .eq('id', id)
      .eq('instructor_id', user!.id)

    if (error) {
      setSaveError('Failed to save changes. Please try again.')
      setSaving(false)
      return
    }

    navigate('/instructor')
  }

  if (authLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Loading...</div>
  }

  if (!activity) {
    return <div className="flex justify-center py-20 text-slate-500">Loading activity...</div>
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="mb-8">
        <Link to="/instructor" className="text-sm text-slate-400 hover:text-kiln-600 transition-colors">
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-3 mb-1">Edit Activity</h1>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
          activity.type === 'peer_critique' ? 'bg-blue-100 text-blue-700' :
          activity.type === 'socratic_chain' ? 'bg-purple-100 text-purple-700' :
          activity.type === 'peer_clarification' ? 'bg-teal-100 text-teal-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {activity.type === 'peer_critique' ? 'Peer Critique' :
           activity.type === 'socratic_chain' ? 'Socratic Chain' :
           activity.type === 'peer_clarification' ? 'Peer Clarification' :
           'Evidence Analysis'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Activity Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {activity.type === 'peer_critique' ? 'Opening Prompt' :
             activity.type === 'peer_clarification' ? 'Confusion Prompt' :
             activity.type === 'evidence_analysis' ? 'Evidence & Interpretation Prompt' :
             'Initial Question'}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-32 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors leading-relaxed"
          />
        </div>

        {activity.type === 'socratic_chain' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Learning Objectives (one per line)
            </label>
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              className="w-full h-24 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors"
            />
          </div>
        )}

        {activity.type === 'peer_critique' && (
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

        {activity.type === 'peer_clarification' && (
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

        {activity.type === 'evidence_analysis' && (
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Rounds
            </label>
            {(activity.type === 'peer_clarification' || activity.type === 'evidence_analysis') ? (
              <div className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-500 text-sm">
                2 rounds (fixed)
              </div>
            ) : (
              <select
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
              >
                {(activity.type === 'peer_critique' ? [2, 3] : [2, 3, 4, 5]).map((n) => (
                  <option key={n} value={n}>
                    {n === 2 && activity.type === 'peer_critique' ? '2 — Claim + Critique'
                      : n === 3 && activity.type === 'peer_critique' ? '3 — Claim + Critique + Rebuttal'
                      : `${n} rounds`}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Time per Round
            </label>
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
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {saveError}
          </p>
        )}

        <div className="flex gap-3">
          <Link
            to="/instructor"
            className="flex-1 px-6 py-3.5 text-center bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !title.trim() || !prompt.trim()}
            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white font-semibold rounded-xl hover:from-kiln-600 hover:to-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-kiln-200 active:scale-95"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
