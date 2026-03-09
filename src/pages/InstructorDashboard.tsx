import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { generateJoinCode } from '../lib/utils'
import type { Activity } from '../lib/types'
import { Plus, Play, LogOut, Mail, ArrowRight, ArrowUpRight } from 'lucide-react'

export function InstructorDashboard() {
  const { user, loading, signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState<Activity[]>([])
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [activeSessions, setActiveSessions] = useState<{ id: string; join_code: string; status: string; activity: { title: string }[] | null }[]>([])

  useEffect(() => {
    if (user) {
      loadActivities()
      loadActiveSessions()
    }
  }, [user])

  async function loadActiveSessions() {
    const { data } = await supabase
      .from('sessions')
      .select('id, join_code, status, activity:activities(title)')
      .eq('instructor_id', user!.id)
      .in('status', ['lobby', 'active', 'between_rounds'])
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setActiveSessions(data as typeof activeSessions)
  }

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
    if (starting) return
    setStarting(true)
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
      setSessionError('Failed to create session. Please try again.')
      setStarting(false)
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Instructor Sign In
          </h1>

          {emailSent ? (
            <div className="text-center animate-slide-up">
              <div className="p-4 bg-kiln-50 rounded-2xl w-fit mx-auto mb-5">
                <Mail className="w-10 h-10 text-kiln-500" />
              </div>
              <p className="text-slate-700 font-medium">Check your email for a magic link.</p>
              <p className="text-sm text-slate-500 mt-2">
                Click the link to sign in — no password needed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="flex flex-col gap-5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.edu"
                className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
                autoFocus
              />
              {authError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{authError}</p>
              )}
              <button
                type="submit"
                disabled={!email.trim()}
                className="px-6 py-3.5 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white font-semibold rounded-xl hover:from-kiln-600 hover:to-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-kiln-200 active:scale-95"
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
    <div className="flex flex-col gap-8 animate-fade-in">
      {activeSessions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Resume Session</p>
          <div className="flex flex-col gap-2">
            {activeSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800 text-sm">{s.activity?.[0]?.title ?? 'Untitled'}</span>
                  <span className="font-mono text-xs text-slate-500">{s.join_code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.status === 'lobby' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {s.status === 'between_rounds' ? 'paused' : s.status}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/instructor/session/${s.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Resume
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessionError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{sessionError}</p>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Your Activities</h1>
        <div className="flex gap-3">
          <Link
            to="/instructor/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white font-medium rounded-xl hover:from-kiln-600 hover:to-kiln-700 transition-all shadow-md shadow-kiln-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Activity
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2.5 text-slate-400 hover:text-slate-600 transition-colors rounded-xl hover:bg-slate-100"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-20 animate-slide-up">
          <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto mb-5">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-lg text-slate-500 mb-3">No activities yet.</p>
          <Link
            to="/instructor/create"
            className="inline-flex items-center gap-1 text-kiln-600 font-medium hover:text-kiln-700 transition-colors"
          >
            Create your first activity <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {activities.map((a) => (
            <div key={a.id} className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{a.title}</h3>
                  <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                    {a.type === 'peer_critique' ? 'Peer Critique' : 'Socratic Chain'}
                  </span>
                </div>
                <button
                  onClick={() => startSession(a)}
                  disabled={starting}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start
                </button>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                {a.config.initial_prompt}
              </p>
              <p className="text-xs text-slate-400 mt-3 font-medium">
                {a.config.rounds} rounds · {a.config.round_duration_sec}s each
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
