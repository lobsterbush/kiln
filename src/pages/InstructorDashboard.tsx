import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { generateJoinCode, formatDuration } from '../lib/utils'
import type { Activity, ActivityType } from '../lib/types'
import { Plus, Play, LogOut, Mail, ArrowRight, ArrowUpRight, Pencil, Trash2, Clock, CopyPlus, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { ACTIVITY_META } from '../lib/activity-meta'

export function InstructorDashboard() {
  const { user, loading, signIn, signUp, sendMagicLink, signOut } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState<Activity[]>([])
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'magic'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [confirmationNeeded, setConfirmationNeeded] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [activeSessions, setActiveSessions] = useState<{ id: string; join_code: string; status: string; activity: { title: string }[] | null }[]>([])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [pastSessions, setPastSessions] = useState<{ id: string; join_code: string; created_at: string; activity: { title: string }[] | null; participants: { count: number }[] }[]>([])
  const [showAllPast, setShowAllPast] = useState(false)
  const [sessionStats, setSessionStats] = useState<Map<string, { count: number; lastRun: string }>>(new Map())

  useEffect(() => {
    if (user) {
      loadActivities()
      loadActiveSessions()
      loadPastSessions()
      loadSessionStats()
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

  async function handleDiscardSession(sessionId: string) {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId)
      .eq('instructor_id', user!.id)
    if (!error) {
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId))
    }
  }

  async function loadSessionStats() {
    const { data } = await supabase
      .from('sessions')
      .select('activity_id, created_at')
      .eq('instructor_id', user!.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
    if (!data) return
    const map = new Map<string, { count: number; lastRun: string }>()
    for (const s of data) {
      const id = s.activity_id as string
      const existing = map.get(id)
      if (!existing) {
        map.set(id, { count: 1, lastRun: s.created_at })
      } else {
        map.set(id, { count: existing.count + 1, lastRun: existing.lastRun })
      }
    }
    setSessionStats(map)
  }

  async function loadPastSessions(all = false) {
    const query = supabase
      .from('sessions')
      .select('id, join_code, created_at, activity:activities(title), participants:participants(count)')
      .eq('instructor_id', user!.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
    const { data } = all ? await query : await query.limit(5)
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
      .limit(200)
    if (error) setLoadError('Could not load activities. Please refresh.')
    if (data) setActivities(data)
    setLoadingActivities(false)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setAuthError(null)
    const { error } = await signIn(email, password)
    if (error) {
      const msg = error.message
      setAuthError(
        msg === 'Invalid login credentials'
          ? 'Incorrect email or password. If you previously used a magic link, use "Use magic link instead" below.'
          : msg
      )
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setAuthError(null)
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setAuthError('Password must be at least 8 characters.')
      return
    }
    const { error, needsConfirmation } = await signUp(email, password)
    if (error) {
      setAuthError(error.message)
    } else if (needsConfirmation) {
      setConfirmationNeeded(true)
    }
    // else: session is set automatically by AuthProvider
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setAuthError(null)
    const { error } = await sendMagicLink(email)
    if (error) {
      setAuthError(error.message)
    } else {
      setEmailSent(true)
    }
  }

  async function handleDuplicate(activity: Activity) {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        instructor_id: user!.id,
        title: `Copy of ${activity.title}`,
        type: activity.type,
        config: activity.config,
      })
      .select()
      .single()
    if (!error && data) {
      setActivities((prev) => [data as Activity, ...prev])
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">
            {authMode === 'signup' ? 'Create Account' : 'Instructor Sign In'}
          </h1>
          <p className="text-sm text-slate-500 text-center mb-8">
            {authMode === 'signup' ? 'Start running Kiln activities today.' : 'Welcome back.'}
          </p>

          {confirmationNeeded ? (
            <div className="text-center animate-slide-up">
              <div className="p-4 bg-kiln-50 rounded-2xl w-fit mx-auto mb-5">
                <Mail className="w-10 h-10 text-kiln-500" />
              </div>
              <p className="text-slate-700 font-medium">Confirm your email to continue.</p>
              <p className="text-sm text-slate-500 mt-2">Check your inbox and click the confirmation link.</p>
              <button
                onClick={() => { setConfirmationNeeded(false); setAuthMode('signin') }}
                className="mt-5 text-sm text-kiln-600 hover:text-kiln-700 font-medium"
              >
                Back to sign in
              </button>
            </div>
          ) : emailSent ? (
            <div className="text-center animate-slide-up">
              <div className="p-4 bg-kiln-50 rounded-2xl w-fit mx-auto mb-5">
                <Mail className="w-10 h-10 text-kiln-500" />
              </div>
              <p className="text-slate-700 font-medium">Check your email for a magic link.</p>
              <p className="text-sm text-slate-500 mt-2">Click the link to sign in — no password needed.</p>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mt-4">
                Open the link on <strong>this device and browser</strong> — it won't work if you switch devices.
              </p>
              <button
                onClick={() => { setEmailSent(false); setAuthMode('signin') }}
                className="mt-5 text-sm text-kiln-600 hover:text-kiln-700 font-medium"
              >
                Back to sign in
              </button>
            </div>
          ) : authMode === 'magic' ? (
            <div className="flex flex-col gap-5 animate-slide-up">
              <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
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
              <button
                onClick={() => { setAuthMode('signin'); setAuthError(null) }}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors text-center"
              >
                ← Back to sign in
              </button>
            </div>
          ) : authMode === 'signup' ? (
            <div className="flex flex-col gap-5 animate-slide-up">
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.edu"
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
                  autoFocus
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (8+ characters)"
                    className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
                />
                {authError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{authError}</p>
                )}
                <button
                  type="submit"
                  disabled={!email.trim() || !password.trim() || !confirmPassword.trim()}
                  className="px-6 py-3.5 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white font-semibold rounded-xl hover:from-kiln-600 hover:to-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-kiln-200 active:scale-95"
                >
                  Create Account
                </button>
              </form>
              <button
                onClick={() => { setAuthMode('signin'); setAuthError(null) }}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors text-center"
              >
                Already have an account? Sign in
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5 animate-slide-up">
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.edu"
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors"
                  autoFocus
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-kiln-400 transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{authError}</p>
                )}
                <button
                  type="submit"
                  disabled={!email.trim() || !password.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white font-semibold rounded-xl hover:from-kiln-600 hover:to-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-kiln-200 active:scale-95"
                >
                  Sign In <ChevronRight className="w-4 h-4" />
                </button>
              </form>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => { setAuthMode('signup'); setAuthError(null); setPassword(''); setConfirmPassword('') }}
                  className="text-sm text-slate-500 hover:text-kiln-600 transition-colors text-center"
                >
                  No account? Create one →
                </button>
                <button
                  onClick={() => { setAuthMode('magic'); setAuthError(null); setPassword('') }}
                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors text-center"
                >
                  Use magic link instead
                </button>
              </div>
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
              <div key={s.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="font-semibold text-slate-800 text-sm truncate">{s.activity?.[0]?.title ?? 'Untitled'}</span>
                  <span className="font-mono text-xs text-slate-500 shrink-0">{s.join_code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    s.status === 'lobby' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {s.status === 'between_rounds' ? 'paused' : s.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDiscardSession(s.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Discard session"
                  >
                    ×
                  </button>
                  <button
                    onClick={() => navigate(`/instructor/session/${s.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Resume
                  </button>
                </div>
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
          {[1, 2, 3, 4].map((i) => (
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
          {activities.map((a) => {
            const meta = ACTIVITY_META[a.type as ActivityType]
            const isScenario = a.type === 'scenario_solo' || a.type === 'scenario_multi'
            return (
            <div key={a.id} className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{a.title}</h3>
                  <span className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${meta?.color.badge ?? 'bg-slate-100 text-slate-600'}`}>
                    {meta?.shortLabel ?? a.type}
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
                      onClick={() => handleDuplicate(a)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <CopyPlus className="w-3.5 h-3.5" />
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
                {isScenario ? (a.config.scenario_context ?? '') : a.config.initial_prompt}
              </p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-400 font-medium">
                  {isScenario
                    ? `${a.config.max_turns ?? 8} turns${a.config.ai_personas?.length ? ` \u00b7 ${a.config.ai_personas.length} persona${a.config.ai_personas.length !== 1 ? 's' : ''}` : ''}`
                    : a.type === 'peer_critique'
                    ? a.config.rounds === 2
                      ? `Claim \u2192 Critique \u00b7 ${formatDuration(a.config.round_duration_sec)}`
                      : `Claim \u2192 Critique \u2192 Rebuttal \u00b7 ${formatDuration(a.config.round_duration_sec)}`
                    : a.type === 'peer_clarification'
                    ? `Confusion \u2192 Explanation \u00b7 ${formatDuration(a.config.round_duration_sec)}`
                    : a.type === 'evidence_analysis'
                    ? `Interpretation \u2192 Gap Analysis \u00b7 ${formatDuration(a.config.round_duration_sec)}`
                    : `${a.config.rounds} rounds \u00b7 ${formatDuration(a.config.round_duration_sec)} each`
                  }
                </p>
                {sessionStats.has(a.id) && (() => {
                  const stats = sessionStats.get(a.id)!
                  const d = new Date(stats.lastRun)
                  const sameYear = d.getFullYear() === new Date().getFullYear()
                  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(!sameYear && { year: 'numeric' }) })
                  return (
                    <span className="text-xs text-slate-300 shrink-0">
                      {stats.count} run{stats.count !== 1 ? 's' : ''} \u00b7 {dateStr}
                    </span>
                  )
                })()}
              </div>
            </div>
          )})
          }
        </div>
      )}
      {pastSessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Past Sessions</p>
            </div>
            {!showAllPast && pastSessions.length === 5 && (
              <button
                onClick={() => { setShowAllPast(true); loadPastSessions(true) }}
                className="text-xs text-kiln-600 hover:text-kiln-700 font-medium transition-colors"
              >
                Show all
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {pastSessions.map((s) => {
              const d = new Date(s.created_at)
              const sameYear = d.getFullYear() === new Date().getFullYear()
              const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(!sameYear && { year: 'numeric' }) })
              const participantCount = s.participants?.[0]?.count ?? null
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-sm font-medium text-slate-700 truncate">{s.activity?.[0]?.title ?? 'Untitled'}</span>
                    <span className="font-mono text-xs text-slate-400 shrink-0">{s.join_code}</span>
                    {participantCount !== null && (
                      <span className="text-xs text-slate-400 shrink-0">{participantCount} student{participantCount !== 1 ? 's' : ''}</span>
                    )}
                    <span className="text-xs text-slate-300 shrink-0">{dateStr}</span>
                  </div>
                  <Link
                    to={`/instructor/results/${s.id}`}
                    className="text-xs font-medium text-kiln-600 hover:text-kiln-700 transition-colors shrink-0"
                  >
                    View results \u2192
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
