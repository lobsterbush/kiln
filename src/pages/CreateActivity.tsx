import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { ActivityType } from '../lib/types'
import { Users, BookOpen } from 'lucide-react'
import { cn } from '../lib/utils'

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
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Create Activity</h1>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setType('peer_critique')}
            className="flex items-center gap-4 p-6 bg-white rounded-lg border-2 border-slate-200 hover:border-orange-400 transition-colors text-left"
          >
            <Users className="w-10 h-10 text-orange-500 shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900">Peer Critique</h3>
              <p className="text-sm text-slate-500">
                Students write claims, critique each other's arguments, and respond to criticism in timed rounds.
              </p>
            </div>
          </button>
          <button
            onClick={() => setType('socratic_chain')}
            className="flex items-center gap-4 p-6 bg-white rounded-lg border-2 border-slate-200 hover:border-orange-400 transition-colors text-left"
          >
            <BookOpen className="w-10 h-10 text-orange-500 shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900">Socratic Chain</h3>
              <p className="text-sm text-slate-500">
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
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        {type === 'peer_critique' ? 'Peer Critique' : 'Socratic Chain'}
      </h1>
      <button
        onClick={() => setType(null)}
        className="text-sm text-slate-500 hover:text-orange-600 mb-6"
      >
        ← Change type
      </button>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Activity Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Democratic Backsliding Debate"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
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
            className="w-full h-28 px-4 py-2 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {type === 'socratic_chain' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Learning Objectives (one per line)
            </label>
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Evaluate institutional vs cultural explanations&#10;Identify necessary vs sufficient conditions"
              className="w-full h-20 px-4 py-2 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rounds</label>
            <select
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} rounds</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Time per Round</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={cn(
                'w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300'
              )}
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
          className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Creating...' : 'Create Activity'}
        </button>
      </form>
    </div>
  )
}
