import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { generateJoinCode } from '../lib/utils'
import type { Activity } from '../lib/types'
import { Plus, Play, LogOut, Mail } from 'lucide-react'

export function InstructorDashboard() {
  const { user, loading, signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState<Activity[]>([])
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (user) loadActivities()
  }, [user])

  async function loadActivities() {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('instructor_id', user!.id)
      .order('created_at', { ascending: false })
    if (data) setActivities(data)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setAuthError(null)
    const { error } = await signIn(email)
    if (error) {
      setAuthError(error.message)
    } else {
      setEmailSent(true)
    }
  }

  async function startSession(activity: Activity) {
    const joinCode = generateJoinCode()
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        activity_id: activity.id,
        instructor_id: user!.id,
        join_code: joinCode,
      })
      .select()
      .single()

    if (error || !session) {
      alert('Failed to create session')
      return
    }

    navigate(`/instructor/session/${session.id}`)
  }

  if (loading) {
    return <div className="flex justify-center py-20 text-slate-500">Loading...</div>
  }

  // Sign-in form
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Instructor Sign In
          </h1>

          {emailSent ? (
            <div className="text-center">
              <Mail className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <p className="text-slate-700">Check your email for a magic link.</p>
              <p className="text-sm text-slate-500 mt-2">
                Click the link to sign in — no password needed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.edu"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                autoFocus
              />
              {authError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{authError}</p>
              )}
              <button
                type="submit"
                disabled={!email.trim()}
                className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send Magic Link
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Dashboard
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Your Activities</h1>
        <div className="flex gap-3">
          <Link
            to="/instructor/create"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Activity
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg mb-2">No activities yet.</p>
          <Link to="/instructor/create" className="text-orange-600 hover:text-orange-700">
            Create your first activity →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((a) => (
            <div key={a.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{a.title}</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {a.type === 'peer_critique' ? 'Peer Critique' : 'Socratic Chain'}
                  </span>
                </div>
                <button
                  onClick={() => startSession(a)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <Play className="w-3 h-3" />
                  Start
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                {a.config.initial_prompt}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {a.config.rounds} rounds · {a.config.round_duration_sec}s each
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
