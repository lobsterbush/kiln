import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { generateJoinCode } from '../lib/utils'
import type { Activity } from '../lib/types'
import { Plus, Play, LogOut, Mail, ArrowRight, ArrowUpRight, Pencil, Trash2, Clock } from 'lucide-react'

export function InstructorDashboard() {
  const { user, loading, signIn, signInWithGoogle, signOut } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState<Activity[]>([])
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [activeSessions, setActiveSessions] = useState<{ id: string; join_code: string; status: string; activity: { title: string }[] | null }[]>([])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [pastSessions, setPastSessions] = useState<{ id: string; join_code: string; created_at: string; activity: { title: string }[] | null }[]>([])

  useEffect(() => {
    if (user) {
      loadActivities()
      loadActiveSessions()
      loadPastSessions()
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

  async function loadPastSessions() {
    const { data } = await supabase
      .from('sessions')
      .select('id, join_code, created_at, activity:activities(title)')
      .eq('instructor_id', user!.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(8)
    if (data) setPastSessions(data as typeof pastSessions)
  }

  async function handleDelete(activityId: string) {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)
      .eq('instructor_id', user!.id)
    if (error) {
      setSessionError('Could not delete — this activity may have associated sessions.')
      setConfirmDelete(null)
      return
    }
    setActivities((prev) => prev.filter((a) => a.id !== activityId))
    setConfirmDelete(null)
  }

  async function loadActivities() {
    setLoadingActivities(true)
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('instructor_id', user!.id)
      .order('created_at', { ascending: false })
    if (error) setLoadError('Could not load activities. Please refresh.')
    if (data) setActivities(data)
    setLoadingActivities(false)
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

    setStarting(false)
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
            <div className="flex flex-col gap-5">
              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all font-medium text-slate-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
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
            </div>
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

      {loadError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{loadError}</p>
      )}

      {loadingActivities ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
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
                {confirmDelete === a.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs px-2.5 py-1.5 text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-xs px-2.5 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      Confirm delete
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/instructor/edit/${a.id}`)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(a.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => startSession(a)}
                      disabled={starting}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start
                    </button>
                  </div>
                )}
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
      {pastSessions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Past Sessions</p>
          </div>
          <div className="flex flex-col gap-1.5">
            {pastSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">{s.activity?.[0]?.title ?? 'Untitled'}</span>
                  <span className="font-mono text-xs text-slate-400">{s.join_code}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <Link
                  to={`/instructor/results/${s.id}`}
                  className="text-xs font-medium text-kiln-600 hover:text-kiln-700 transition-colors"
                >
                  View results →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
