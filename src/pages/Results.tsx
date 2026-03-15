import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Session, Activity, Participant, Response as KilnResponse, PeerAssignment, FollowUp } from '../lib/types'
import { Download, ArrowLeft, Sparkles, Loader2, Play, MessageSquare, TrendingUp, TrendingDown, Minus, Copy, Check, Info } from 'lucide-react'
import { generateJoinCode, copyToClipboard } from '../lib/utils'

export function Results() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [responses, setResponses] = useState<KilnResponse[]>([])
  const [assignments, setAssignments] = useState<PeerAssignment[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [debrief, setDebrief] = useState<{
    themes: string[]; gaps: string[]; notable: { quote: string; why: string }[]; suggestion: string
  } | null>(null)
  const [debriefLoading, setDebriefLoading] = useState(false)
  const [debriefError, setDebriefError] = useState<string | null>(null)
  const [runningAgain, setRunningAgain] = useState(false)
  const [sessionHistory, setSessionHistory] = useState<{
    id: string; created_at: string; join_code: string
    participants: { count: number }[]
    responses: { count: number }[]
  }[]>([])
  const [feedback, setFeedback] = useState<{ participant_id: string; name: string; text: string }[] | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [debriefCopied, setDebriefCopied] = useState(false)
  const [scenarioMessages, setScenarioMessages] = useState<{ participant_id: string; turn: number; speaker_type: string; speaker_name: string; content: string }[]>([])
  const [scenarioEvaluations, setScenarioEvaluations] = useState<{ participant_id: string; content: { scores: Record<string, number>; feedback: string } }[]>([])
  const [evaluatingScenario, setEvaluatingScenario] = useState(false)
  const [evaluationError, setEvaluationError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/instructor')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!id || !user) return
    loadData()
  }, [id, user])

  async function loadData() {
    const [sessResult, partsResult, respsResult, assignsResult, followUpsResult] = await Promise.all([
      supabase.from('sessions').select('*, activity:activities(*)').eq('id', id!).eq('instructor_id', user!.id).single(),
      supabase.from('participants').select('*').eq('session_id', id!),
      supabase.from('responses').select('*').eq('session_id', id!)
        .order('round', { ascending: true }).order('submitted_at', { ascending: true }),
      supabase.from('peer_assignments').select('*').eq('session_id', id!),
      supabase.from('follow_ups').select('*').eq('session_id', id!),
    ])

    if (!sessResult.data) {
      setLoadError('Session not found or you do not have permission to view it.')
      return
    }
    if (partsResult.error || respsResult.error || assignsResult.error) {
      setLoadError('Could not load session data. Please refresh.')
      return
    }

    setSession(sessResult.data)
    setActivity(sessResult.data.activity as Activity)
    if (partsResult.data) setParticipants(partsResult.data)
    if (respsResult.data) setResponses(respsResult.data)
    if (assignsResult.data) setAssignments(assignsResult.data)
    if (followUpsResult.data) setFollowUps(followUpsResult.data as FollowUp[])

    // For scenario activities, load scenario data
    const actType = (sessResult.data.activity as Activity).type
    if (actType === 'scenario_solo' || actType === 'scenario_multi') {
      const [msgsRes, evalsRes] = await Promise.all([
        supabase.from('scenario_messages').select('participant_id, turn, speaker_type, speaker_name, content').eq('session_id', id!).order('turn', { ascending: true }),
        supabase.from('scenario_evaluations').select('participant_id, content').eq('session_id', id!),
      ])
      if (msgsRes.data) setScenarioMessages(msgsRes.data)
      if (evalsRes.data) setScenarioEvaluations(evalsRes.data as any)
    }

    // Load cross-session history (non-blocking)
    const activityId = (sessResult.data.activity as Activity).id
    supabase
      .from('sessions')
      .select('id, created_at, join_code, participants:participants(count), responses:responses(count)')
      .eq('activity_id', activityId)
      .eq('instructor_id', user!.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setSessionHistory(data as typeof sessionHistory)
      })
  }

  async function runAgain() {
    if (!activity || !user || runningAgain) return
    setRunningAgain(true)
    const joinCode = generateJoinCode()
    const { data: newSession, error } = await supabase
      .from('sessions')
      .insert({ activity_id: activity.id, instructor_id: user.id, join_code: joinCode })
      .select()
      .single()
    if (!error && newSession) {
      navigate(`/instructor/session/${newSession.id}`)
    } else {
      setRunningAgain(false)
    }
  }

  async function generateFeedback() {
    if (!session) return
    setFeedbackLoading(true)
    setFeedbackError(null)
    try {
      const { data, error } = await supabase.functions.invoke('generate-feedback', {
        body: { session_id: session.id },
      })
      if (error || !data) throw new Error(error?.message ?? 'No data returned')
      setFeedback(data.feedback)
    } catch {
      setFeedbackError('Could not generate feedback. Please try again.')
    } finally {
      setFeedbackLoading(false)
    }
  }

  async function generateDebrief() {
    if (!session) return
    setDebriefLoading(true)
    setDebriefError(null)
    try {
      const { data, error } = await supabase.functions.invoke('generate-debrief', {
        body: { session_id: session.id },
      })
      if (error || !data) throw new Error(error?.message ?? 'No data returned')
      setDebrief(data)
    } catch (err) {
      setDebriefError('Could not generate debrief. Please try again.')
    } finally {
      setDebriefLoading(false)
    }
  }

  function exportGradebookCSV() {
    if (!activity) return
    const totalRounds = activity.config.rounds
    const headers = ['name', 'participated', 'rounds_submitted', 'total_rounds', 'participation_pct', 'total_words', 'avg_words']
    const rows = participants.map((p) => {
      const pResponses = responses.filter((r) => r.participant_id === p.id)
      const participated = pResponses.length > 0 ? 1 : 0
      const roundsSubmitted = pResponses.length
      const words = pResponses.reduce((sum, r) => sum + r.content.trim().split(/\s+/).filter(Boolean).length, 0)
      const avgWords = roundsSubmitted > 0 ? Math.round(words / roundsSubmitted) : 0
      const pct = totalRounds > 0 ? Math.round((roundsSubmitted / totalRounds) * 100) : 0
      return [`"${p.display_name.replace(/"/g, '""')}"`, participated, roundsSubmitted, totalRounds, pct, words, avgWords].join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kiln-gradebook-${session?.join_code ?? id}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function evaluateScenario() {
    if (!session) return
    setEvaluatingScenario(true)
    setEvaluationError(null)
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-scenario', {
        body: { session_id: session.id },
      })
      if (error || !data) throw new Error(error?.message ?? 'No data')
      setScenarioEvaluations(data.evaluations ?? [])
    } catch {
      setEvaluationError('Could not generate evaluations. Please try again.')
    } finally {
      setEvaluatingScenario(false)
    }
  }

  async function copyDebrief() {
    if (!debrief || !activity || !session) return
    const date = new Date(session.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const lines = [
      `${activity.title} — ${date}`,
      '',
      `Themes: ${debrief.themes.map((t) => `• ${t}`).join('  ')}`,
      '',
      `Gaps: ${debrief.gaps.map((g) => `• ${g}`).join('  ')}`,
    ]
    if (debrief.notable?.length > 0) {
      lines.push('')
      lines.push('Worth discussing:')
      debrief.notable.forEach((n) => lines.push(`  "${n.quote}" — ${n.why}`))
    }
    lines.push('')
    lines.push(`Teaching suggestion: ${debrief.suggestion}`)
    const ok = await copyToClipboard(lines.join('\n'))
    if (ok) {
      setDebriefCopied(true)
      setTimeout(() => setDebriefCopied(false), 2000)
    }
  }

  function exportCSV() {
    const headers = ['participant', 'round', 'type', 'responding_to', 'content', 'time_taken_ms', 'submitted_at']
    const rows = responses.map((r) => {
      const p = participants.find((p) => p.id === r.participant_id)
      // Peer context: who did this participant respond to?
      const asReviewer = assignments.find((a) => a.reviewer_id === r.participant_id && a.round === r.round - 1)
      const asAuthor = assignments.find((a) => a.author_id === r.participant_id && a.round === r.round - 2)
      let respondingTo = ''
      if (asReviewer) {
        const author = participants.find((q) => q.id === asReviewer.author_id)
        respondingTo = author?.display_name ?? ''
      } else if (asAuthor && (r.response_type === 'rebuttal' || r.response_type === 'evidence_gap')) {
        const reviewer = participants.find((q) => q.id === asAuthor.reviewer_id)
        respondingTo = reviewer?.display_name ?? ''
      }
      return [
        p?.display_name ?? 'Unknown',
        r.round,
        r.response_type,
        respondingTo,
        `"${r.content.replace(/"/g, '""')}"`,
        r.time_taken_ms ?? '',
        r.submitted_at,
      ].join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kiln-session-${session?.join_code ?? id}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (authLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Loading...</div>
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-red-500">{loadError}</p>
        <Link to="/instructor" className="text-sm text-kiln-600 hover:underline">Back to dashboard</Link>
      </div>
    )
  }

  if (!session || !activity) {
    return <div className="flex justify-center py-20 text-slate-500">Loading results...</div>
  }

  const isScenario = activity.type === 'scenario_solo' || activity.type === 'scenario_multi'

  const TYPE_LABELS: Record<string, string> = {
    initial: 'Initial',
    critique: 'Critique',
    rebuttal: 'Rebuttal',
    followup_answer: 'Follow-up',
    clarification: 'Clarification',
    evidence_gap: 'Gap Analysis',
  }

  // Summary stats
  const totalResponses = responses.length
  const totalWords = responses.reduce((sum, r) => sum + r.content.trim().split(/\s+/).filter(Boolean).length, 0)
  const avgWords = totalResponses > 0 ? Math.round(totalWords / totalResponses) : 0

  // Group responses by participant, with peer context inline
  // Filter out participants who never submitted (e.g. joined then left)
  const byParticipant = participants.map((p) => {
    const chain = responses
      .filter((r) => r.participant_id === p.id)
      .sort((a, b) => a.round - b.round)

    // For each response, find what the student was responding TO
    const withContext = chain.map((r) => {
      // assignments are stored at the round whose responses were collected (always round N-1)
      const asReviewer = assignments.find((a) => a.reviewer_id === p.id && a.round === r.round - 1)
      // For rebuttal (round 3): original author is in round 1 assignment
      const asAuthor = assignments.find((a) => a.author_id === p.id && a.round === r.round - 2)

      let context: string | null = null
      if (asReviewer) {
        const author = participants.find((q) => q.id === asReviewer.author_id)
        const name = author?.display_name ?? 'a classmate'
        if (activity?.type === 'peer_clarification') {
          context = `\u2192 explained ${name}'s confusion`
        } else if (activity?.type === 'evidence_analysis') {
          context = `\u2192 found gap in ${name}'s interpretation`
        } else {
          context = `\u2192 critiqued ${name}`
        }
      } else if (asAuthor && r.response_type === 'rebuttal') {
        const reviewer = participants.find((q) => q.id === asAuthor.reviewer_id)
        context = `\u2192 rebutted ${reviewer?.display_name ?? 'a classmate'}'s critique`
      }

      return { ...r, context }
    })

      return { participant: p, chain: withContext }
    }).filter(({ chain }) => chain.length > 0)

  // For Socratic Chain: build a map of follow-up prompts per participant per round
  // follow_ups.round = the round whose response triggered the follow-up
  const followUpMap = new Map<string, string>() // key: `${participant_id}:${round}`
  for (const fu of followUps) {
    followUpMap.set(`${fu.participant_id}:${fu.round}`, fu.prompt)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/instructor" className="text-sm text-slate-400 hover:text-kiln-600 flex items-center gap-1 mb-3 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{activity.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Session <span className="font-mono font-semibold">{session.join_code}</span> · {participants.length} participants · {activity.config.rounds} rounds
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={runAgain}
            disabled={runningAgain}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 font-medium rounded-xl hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-40 transition-all"
          >
            {runningAgain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run again
          </button>
          {isScenario ? (
            <button
              onClick={evaluateScenario}
              disabled={evaluatingScenario}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border-2 border-rose-200 text-rose-700 font-medium rounded-xl hover:border-rose-300 hover:bg-rose-100 disabled:opacity-40 transition-all"
            >
              {evaluatingScenario ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {evaluatingScenario ? 'Evaluating…' : scenarioEvaluations.length > 0 ? `Re-evaluate (${scenarioEvaluations.length})` : 'Evaluate All'}
            </button>
          ) : (
            <button
              onClick={generateFeedback}
              disabled={feedbackLoading}
              className={`flex items-center gap-2 px-4 py-2.5 border-2 font-medium rounded-xl disabled:opacity-40 transition-all ${
                feedback
                  ? 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-300 hover:bg-blue-100'
              }`}
            >
              {feedbackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              {feedbackLoading ? 'Generating…' : feedback ? `Regenerate Feedback (${feedback.length})` : 'Student Feedback'}
            </button>
          )}
          {!isScenario && (
            <button
              onClick={generateDebrief}
              disabled={debriefLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 border-2 border-purple-200 text-purple-700 font-medium rounded-xl hover:border-purple-300 hover:bg-purple-100 disabled:opacity-40 transition-all"
            >
              {debriefLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {debriefLoading ? 'Analysing…' : 'AI Debrief'}
            </button>
          )}
          <button
            onClick={exportGradebookCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-600 font-medium rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Gradebook CSV
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-600 font-medium rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Responses CSV
          </button>
        </div>
      </div>

      {/* Cross-session history */}
      {sessionHistory.length > 1 && (() => {
        const thisIndex = sessionHistory.findIndex((s) => s.id === session.id)
        if (thisIndex === -1) return null // session not yet reflected in history
        const runNumber = sessionHistory.length - thisIndex
        const totalRuns = sessionHistory.length
        const otherSessions = sessionHistory.filter((s) => s.id !== session.id)
        const avgEngagement = otherSessions.length > 0
          ? otherSessions.reduce((sum, s) => {
              const p = s.participants[0]?.count ?? 0
              const r = s.responses[0]?.count ?? 0
              return sum + (p > 0 ? r / p : 0)
            }, 0) / otherSessions.length
          : null
        const thisEngagement = participants.length > 0 ? totalResponses / participants.length : 0
        const delta = avgEngagement != null ? thisEngagement - avgEngagement : null
        const trendColor = delta == null ? 'text-slate-400' : delta > 0.05 ? 'text-emerald-600' : delta < -0.05 ? 'text-red-500' : 'text-slate-500'
        const TrendIcon = delta == null ? Minus : delta > 0.05 ? TrendingUp : delta < -0.05 ? TrendingDown : Minus
        return (
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm flex-wrap">
            <span className="text-slate-500 font-medium">Run #{runNumber} of {totalRuns}</span>
            {avgEngagement != null && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  Avg engagement: <span className="font-semibold text-slate-700">{Math.round(avgEngagement * 100)}%</span>
                  <span className="text-slate-300">vs</span>
                  <span className={`font-semibold ${trendColor}`}>{Math.round(thisEngagement * 100)}% this run</span>
                  <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
                </span>
              </>
            )}
          </div>
        )
      })()}

      {/* Feedback / debrief / evaluation errors */}
      {feedbackError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{feedbackError}</p>
      )}
      {evaluationError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{evaluationError}</p>
      )}

      {/* AI Debrief panel */}
      {debriefError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{debriefError}</p>
      )}
      {debrief && (
        <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 flex flex-col gap-5 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h3 className="font-bold text-slate-900">AI Session Debrief</h3>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={copyDebrief}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              >
                {debriefCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {debriefCopied ? 'Copied!' : 'Copy for slides'}
              </button>
              <button onClick={() => setDebrief(null)} className="text-slate-300 hover:text-slate-500 text-lg leading-none">×</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Main themes</p>
              <ul className="flex flex-col gap-1.5">
                {debrief.themes.map((t, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-purple-400 shrink-0">•</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Gaps & misconceptions</p>
              <ul className="flex flex-col gap-1.5">
                {debrief.gaps.map((g, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-amber-400 shrink-0">•</span>{g}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {debrief.notable?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Worth discussing in class</p>
              <div className="flex flex-col gap-3">
                {debrief.notable.map((n, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-sm text-slate-800 italic mb-1">“{n.quote}”</p>
                    <p className="text-xs text-slate-500">{n.why}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-kiln-50 border border-kiln-200 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-kiln-700 uppercase tracking-wider mb-1">Teaching suggestion</p>
            <p className="text-sm text-kiln-800">{debrief.suggestion}</p>
          </div>
        </div>
      )}

      {/* Student summary info */}
      {session.status === 'completed' && (
        <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-slate-500">
            Students can view their session summary from the device they used to participate. Ask them to visit{' '}
            <span className="font-mono text-xs bg-white border border-slate-200 px-1 py-0.5 rounded">
              {window.location.origin}{import.meta.env.BASE_URL}session/{id}/summary
            </span>
          </p>
        </div>
      )}

      {/* Summary stats */}
      {(participants.length > 0 || totalResponses > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{byParticipant.length}<span className="text-base font-normal text-slate-400">/{participants.length}</span></p>
            <p className="text-xs text-slate-500 mt-0.5">Participated</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{totalResponses}</p>
            <p className="text-xs text-slate-500 mt-0.5">Responses</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{totalWords.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total words</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{avgWords}</p>
            <p className="text-xs text-slate-500 mt-0.5">Avg. words</p>
          </div>
        </div>
      )}

      {byParticipant.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-10">No responses were submitted this session.</p>
      )}
      {participants.length > byParticipant.length && byParticipant.length > 0 && (
        <p className="text-xs text-slate-400">
          {participants.length - byParticipant.length} participant{participants.length - byParticipant.length !== 1 ? 's' : ''} joined but did not submit.
        </p>
      )}
      {/* Scenario participant cards */}
      {isScenario && (
        <div className="flex flex-col gap-4 stagger-children">
          {participants.map((p) => {
            const msgs = scenarioMessages.filter((m) => m.participant_id === p.id)
            const evalResult = scenarioEvaluations.find((e) => e.participant_id === p.id)
            const turnCount = msgs.filter((m) => m.speaker_type === 'student').length
            return (
              <details key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow group" open={!!evalResult}>
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <div>
                    <h3 className="font-semibold text-slate-900">{p.display_name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{turnCount} turn{turnCount !== 1 ? 's' : ''} · {msgs.length} messages</p>
                  </div>
                  {evalResult && (
                    <div className="flex gap-3 mr-3">
                      {Object.entries(evalResult.content.scores).map(([k, v]) => (
                        <div key={k} className="text-center">
                          <p className="text-base font-bold text-slate-800">{v}</p>
                          <p className="text-xs text-slate-400 capitalize">{k}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </summary>
                {evalResult && (
                  <div className="mt-4 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 animate-fade-in">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">AI Evaluation</p>
                    <p className="text-sm text-rose-900 leading-relaxed">{evalResult.content.feedback}</p>
                  </div>
                )}
                {msgs.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    {msgs.map((m, i) => (
                      <div key={i} className={`flex gap-3 ${m.speaker_type === 'student' ? '' : 'pl-4'}`}>
                        <div className="flex flex-col items-center">
                          <span className={`text-xs font-mono w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            m.speaker_type === 'student' ? 'bg-slate-100 text-slate-400' : 'bg-rose-100 text-rose-400'
                          }`}>{m.turn}</span>
                          {i < msgs.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-1" />}
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="text-xs font-medium text-slate-500 mb-0.5">{m.speaker_name}</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{m.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {msgs.length === 0 && (
                  <p className="text-xs text-slate-400 mt-3">No messages yet.</p>
                )}
              </details>
            )
          })}
        </div>
      )}

      {/* Round-based participant cards */}
      {!isScenario && <div className="flex flex-col gap-4 stagger-children">
        {byParticipant.map(({ participant, chain }) => (
          <div key={participant.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
            <h3 className="font-semibold text-slate-900 mb-4">{participant.display_name}</h3>
            {feedback && (() => {
              const fb = feedback.find((f) => f.participant_id === participant.id)
              return fb ? (
                <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-3 animate-fade-in">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900 leading-relaxed">{fb.text}</p>
                </div>
              ) : null
            })()}
            <div className="flex flex-col gap-3">
{chain.map((r) => {
                // For Socratic Chain: show the AI follow-up question between rounds
                const followUpQuestion = activity.type === 'socratic_chain' && r.response_type !== 'followup_answer'
                  ? followUpMap.get(`${participant.id}:${r.round}`)
                  : undefined
                return (
                  <div key={r.id}>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                          {r.round}
                        </span>
                        {(r.round < activity.config.rounds || followUpQuestion) && (
                          <div className="w-px flex-1 bg-slate-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-slate-400">{TYPE_LABELS[r.response_type] ?? r.response_type}</span>
                          {r.context && (
                            <span className="text-xs text-kiln-500 font-medium">{r.context}</span>
                          )}
                          {r.time_taken_ms != null && (
                            <span className="text-xs text-slate-300">{(r.time_taken_ms / 1000).toFixed(1)}s</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">{r.content}</p>
                      </div>
                    </div>
                    {/* AI follow-up question shown between rounds for Socratic Chain */}
                    {followUpQuestion && (
                      <div className="flex gap-3 ml-0 mb-1">
                        <div className="flex flex-col items-center">
                          <div className="w-px h-2 bg-slate-200" />
                          <span className="w-6 h-6 flex items-center justify-center shrink-0">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                          </span>
                          <div className="w-px flex-1 bg-slate-200" />
                        </div>
                        <div className="flex-1 py-2">
                          <p className="text-xs text-purple-500 font-medium mb-0.5">AI follow-up</p>
                          <p className="text-xs text-slate-500 italic leading-relaxed">{followUpQuestion}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>}
    </div>
  )
}
