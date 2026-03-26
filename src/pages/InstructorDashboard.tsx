import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { generateJoinCode, formatDuration } from '../lib/utils'
import { trackEvent } from '../lib/analytics'
import type { Activity, ActivityType } from '../lib/types'
import { Plus, Play, LogOut, Mail, ArrowUpRight, Pencil, Trash2, Clock, CopyPlus, Eye, EyeOff, ChevronRight, MessageSquare, Library, BarChart2, AlertTriangle } from 'lucide-react'
import { ACTIVITY_META } from '../lib/activity-meta'
import { checkUsage } from '../lib/usage-limits'
import type { UsageStatus } from '../lib/usage-limits'

export function InstructorDashboard() {
  const { user, loading, signIn, signUp, sendMagicLink, signInWithOAuth, signOut } = useAuth()
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
  const [usage, setUsage] = useState<UsageStatus | null>(null)

  const loadActiveSessions = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('sessions')
      .select('id, join_code, status, activity:activities(title)')
      .eq('instructor_id', user.id)
      .in('status', ['lobby', 'active', 'between_rounds'])
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setActiveSessions(data as typeof activeSessions)
  }, [user])

  async function handleDiscardSession(sessionId: string) {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId)
      .eq('instructor_id', user!.id)
    if (!error) {
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId))
      // Notify any connected students that the session has ended
      try {
        const bc = supabase.channel(`session:${sessionId}`)
        bc.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            void bc.send({
              type: 'broadcast',
              event: 'session:status',
              payload: { status: 'completed' },
            }).then(() => supabase.removeChannel(bc))
          }
        })
      } catch {
        // Non-critical: students will see updated status on next refresh
      }
    }
  }

  const loadSessionStats = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('sessions')
      .select('activity_id, created_at')
      .eq('instructor_id', user.id)
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
  }, [user])

  const loadPastSessions = useCallback(async (all = false) => {
    if (!user) return
    const query = supabase
      .from('sessions')
      .select('id, join_code, created_at, activity:activities(title), participants:participants(count)')
      .eq('instructor_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
    const { data } = all ? await query : await query.limit(5)
    if (data) setPastSessions(data as typeof pastSessions)
  }, [user])

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

  const loadActivities = useCallback(async () => {
    if (!user) return
    setLoadingActivities(true)
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) setLoadError('Could not load activities. Please refresh.')
    if (data) setActivities(data)
    setLoadingActivities(false)
  }, [user])

   
  useEffect(() => {
    if (user) {
      void loadActivities()
      void loadActiveSessions()
      void loadPastSessions()
      void loadSessionStats()
      void checkUsage(user.id).then(setUsage)
    }
  }, [user, loadActivities, loadActiveSessions, loadPastSessions, loadSessionStats])

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

    // Enforce session limit
    if (usage && !usage.canCreateSession) {
      setSessionError(`You've reached the free tier limit of ${usage.limits.maxSessionsPerSemester} sessions this semester. Upgrade to Pro for unlimited sessions.`)
      return
    }

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
    trackEvent('Session Created', { activity_type: activity.type })
    // Refresh usage count
    void checkUsage(user!.id).then(setUsage)
    void navigate(`/instructor/session/${session.id}`)
  }

  async function handleOAuth(provider: 'google' | 'github' | 'azure') {
    setAuthError(null)
    const { error } = await signInWithOAuth(provider)
    if (error) setAuthError(error.message)
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

          {/* OAuth social sign-in — shown on signin + signup modes */}
          {(authMode === 'signin' || authMode === 'signup') && !confirmationNeeded && (
            <div className="flex flex-col gap-3 mb-6">
              {/* Google */}
              <button
                onClick={() => handleOAuth('google')}
                className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all text-sm font-medium text-slate-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              {/* Microsoft */}
              <button
                onClick={() => handleOAuth('azure')}
                className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all text-sm font-medium text-slate-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 23 23">
                  <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                Continue with Microsoft
              </button>
              {/* GitHub */}
              <button
                onClick={() => handleOAuth('github')}
                className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all text-sm font-medium text-slate-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                Continue with GitHub
              </button>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            </div>
          )}

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
              <p className="text-xs text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-2.5 mt-4">
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
                  className="px-6 py-3.5 bg-kiln-600 text-white font-semibold rounded-xl hover:bg-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
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
                  className="px-6 py-3.5 bg-kiln-600 text-white font-semibold rounded-xl hover:bg-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
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
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-kiln-600 text-white font-semibold rounded-xl hover:bg-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
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
              <div key={s.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="font-semibold text-slate-800 text-sm truncate">{s.activity?.[0]?.title ?? 'Untitled'}</span>
                  <span className="font-mono text-xs text-slate-500 shrink-0">{s.join_code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    s.status === 'lobby' ? 'bg-slate-100 text-slate-600' : 'bg-cyan-100 text-cyan-700'
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
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

      {/* Usage limit warning */}
      {usage?.nearLimit && usage.canCreateSession && (
        <div className="flex items-center gap-2 px-4 py-3 bg-cyan-50 border border-cyan-200 rounded-xl text-sm text-cyan-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            You've used <strong>{usage.sessionsUsed}</strong> of <strong>{usage.limits.maxSessionsPerSemester}</strong> sessions this semester ({usage.sessionsRemaining} remaining).
          </span>
        </div>
      )}
      {usage && !usage.canCreateSession && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Free tier limit reached ({usage.limits.maxSessionsPerSemester} sessions/semester). Upgrade to Pro for unlimited sessions.
          </span>
        </div>
      )}

      {sessionError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{sessionError}</p>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Your Activities</h1>
        <div className="flex gap-3">
          <Link
            to="/feedback"
            className="flex items-center gap-1.5 px-3 py-2.5 text-slate-500 hover:text-kiln-600 border border-slate-200 hover:border-kiln-200 hover:bg-kiln-50 rounded-xl text-sm font-medium transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Feedback</span>
          </Link>
          <Link
            to="/instructor/analytics"
            className="flex items-center gap-1.5 px-3 py-2.5 text-slate-500 hover:text-kiln-600 border border-slate-200 hover:border-kiln-200 hover:bg-kiln-50 rounded-xl text-sm font-medium transition-all"
          >
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </Link>
          <Link
            to="/instructor/templates"
            className="flex items-center gap-1.5 px-3 py-2.5 text-slate-500 hover:text-kiln-600 border border-slate-200 hover:border-kiln-200 hover:bg-kiln-50 rounded-xl text-sm font-medium transition-all"
          >
            <Library className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </Link>
          <Link
            to="/instructor/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-kiln-600 text-white font-medium rounded-xl hover:bg-kiln-700 transition-all shadow-sm"
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
          <div className="p-4 bg-kiln-50 rounded-2xl w-fit mx-auto mb-5">
            <Library className="w-8 h-8 text-kiln-400" />
          </div>
          <p className="text-lg text-slate-700 font-semibold mb-2">Welcome to Kiln</p>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Start from a template — 20+ ready-to-use activities across political science, law, philosophy, business, and more.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/instructor/templates"
              className="inline-flex items-center gap-2 px-5 py-3 bg-kiln-600 text-white font-semibold rounded-xl hover:bg-kiln-700 transition-all shadow-sm"
            >
              <Library className="w-4 h-4" /> Browse Templates
            </Link>
            <Link
              to="/instructor/create"
              className="inline-flex items-center gap-1.5 px-5 py-3 text-sm text-slate-600 font-medium border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              <Plus className="w-4 h-4" /> Create from scratch
            </Link>
          </div>
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
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
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
                    ? `${a.config.max_turns ?? 8} turns${a.config.ai_personas?.length ? ` · ${a.config.ai_personas.length} persona${a.config.ai_personas.length !== 1 ? 's' : ''}` : ''}`
                    : a.type === 'peer_critique'
                    ? a.config.rounds === 2
                      ? `Claim → Critique · ${formatDuration(a.config.round_duration_sec)}`
                      : `Claim → Critique → Rebuttal · ${formatDuration(a.config.round_duration_sec)}`
                    : a.type === 'peer_clarification'
                    ? `Confusion → Explanation · ${formatDuration(a.config.round_duration_sec)}`
                    : a.type === 'evidence_analysis'
                    ? `Interpretation → Gap Analysis · ${formatDuration(a.config.round_duration_sec)}`
                    : `${a.config.rounds} rounds · ${formatDuration(a.config.round_duration_sec)} each`
                  }
                </p>
                {sessionStats.has(a.id) && (() => {
                  const stats = sessionStats.get(a.id)!
                  const d = new Date(stats.lastRun)
                  const sameYear = d.getFullYear() === new Date().getFullYear()
                  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(!sameYear && { year: 'numeric' }) })
                  return (
                    <span className="text-xs text-slate-300 shrink-0">
                      {stats.count} run{stats.count !== 1 ? 's' : ''} · {dateStr}
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
                onClick={() => { setShowAllPast(true); void loadPastSessions(true) }}
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
                    View results →
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
