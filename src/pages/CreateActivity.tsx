import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { ActivityType } from '../lib/types'
import { Users, BookOpen } from 'lucide-react'

export function CreateActivity() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [type, setType] = useState<ActivityType | null>(null)
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [rounds, setRounds] = useState(3)
  const [duration, setDuration] = useState(90)
  const [objectives, setObjectives] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !type || !title.trim() || !prompt.trim()) return

    setSaving(true)
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
      },
    })

    if (error) {
      alert('Failed to create activity')
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

  // Step 2: Configure
  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        {type === 'peer_critique' ? 'Peer Critique' : 'Socratic Chain'}
      </h1>
      <button
        onClick={() => setType(null)}
        className="text-sm text-slate-500 hover:text-kiln-600 mb-8 transition-colors"
      >
        ← Change type
      </button>

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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Rounds</label>
            <select
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
            >
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} rounds</option>
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
                <option key={s} value={s}>{s} seconds</option>
              ))}
            </select>
          </div>
        </div>

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
