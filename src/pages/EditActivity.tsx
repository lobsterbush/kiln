import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { Activity, MediaType } from '../lib/types'
import { MediaUpload } from '../components/shared/MediaUpload'

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
  const [sourceMaterial, setSourceMaterial] = useState('')
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [mediaUrl, setMediaUrl] = useState<string | undefined>()
  const [mediaType, setMediaType] = useState<MediaType | undefined>()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/instructor')
  }, [user, authLoading, navigate])

  const loadActivity = useCallback(async () => {
    if (!id || !user) return
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .eq('instructor_id', user.id)
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
      setSourceMaterial(data.config.source_material ?? '')
      setAutoAdvance(data.config.auto_advance ?? false)
      setMediaUrl(data.config.media_url)
      setMediaType(data.config.media_type)
    }
  }, [id, user])

  useEffect(() => {
    loadActivity()
  }, [loadActivity])

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
          ...(activity.type === 'socratic_chain' && {
            source_material: sourceMaterial.trim() || null,
          }),
          auto_advance: autoAdvance,
          ...(mediaUrl ? { media_url: mediaUrl, media_type: mediaType } : { media_url: null, media_type: null }),
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
          activity.type === 'scenario_solo' ? 'bg-rose-100 text-rose-700' :
          activity.type === 'scenario_multi' ? 'bg-indigo-100 text-indigo-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {activity.type === 'peer_critique' ? 'Peer Critique' :
           activity.type === 'socratic_chain' ? 'Socratic Chain' :
           activity.type === 'peer_clarification' ? 'Peer Clarification' :
           activity.type === 'scenario_solo' ? 'Scenario Solo' :
           activity.type === 'scenario_multi' ? 'Scenario Multi' :
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

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Learning Objectives{' '}
            <span className="normal-case font-normal text-slate-400">(optional — one per line)</span>
          </label>
          <textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            className="w-full h-24 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-kiln-400 transition-colors"
          />
          <p className="text-xs text-slate-400 mt-1.5">Used by AI to generate more targeted student feedback.</p>
        </div>

        {activity.type === 'socratic_chain' && (
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
              <p className="text-xs text-amber-600">Long passages will be trimmed to ~3,000 characters. Consider pasting the most relevant excerpt.</p>
            )}
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

        {/* Rounds / duration / auto-advance — not applicable for scenario activities */}
        {activity.type !== 'scenario_solo' && activity.type !== 'scenario_multi' && (
          <>
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
          </>
        )}

        {/* Media upload */}
        {user && (
          <MediaUpload
            instructorId={user.id}
            mediaUrl={mediaUrl}
            mediaType={mediaType}
            onChange={(url, mt) => { setMediaUrl(url); setMediaType(mt) }}
          />
        )}

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
