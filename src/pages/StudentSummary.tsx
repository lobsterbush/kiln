import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, MessageSquare, Sparkles, User, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getStudentToken } from '../lib/utils'

const TYPE_LABELS: Record<string, string> = {
  initial: 'Initial response',
  critique: 'Peer critique',
  rebuttal: 'Rebuttal',
  followup_answer: 'Follow-up answer',
  clarification: 'Clarification',
  evidence_gap: 'Gap analysis',
}

const ACTIVITY_COLORS: Record<string, string> = {
  peer_critique: 'bg-blue-100 text-blue-700',
  socratic_chain: 'bg-purple-100 text-purple-700',
  peer_clarification: 'bg-teal-100 text-teal-700',
  evidence_analysis: 'bg-cyan-100 text-cyan-700',
}

const ACTIVITY_LABELS: Record<string, string> = {
  peer_critique: 'Peer Critique',
  socratic_chain: 'Socratic Chain',
  peer_clarification: 'Peer Clarification',
  evidence_analysis: 'Evidence Analysis',
  scenario_solo: 'Scenario Solo',
  scenario_multi: 'Scenario Multi',
}

interface ScenarioMessage {
  turn: number
  speaker_type: 'student' | 'ai'
  speaker_name: string
  content: string
}

interface SummaryData {
  participant_name: string
  ai_feedback: string | null
  join_code: string
  session_date: string
  activity_title: string
  activity_type: string
  activity_config: { rounds: number; initial_prompt: string }
  responses: { round: number; content: string; response_type: string; time_taken_ms: number | null }[]
  follow_ups: { round: number; prompt: string }[]
}

export function StudentSummary() {
  const { id } = useParams<{ id: string }>()
  const [studentToken] = useState(() => getStudentToken())
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [scenarioMessages, setScenarioMessages] = useState<ScenarioMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    // Token must exist and belong to this session
    if (!studentToken || studentToken.session_id !== id) {
      setError('wrong-device')
      setLoading(false)
      return
    }

    const { data, error: rpcError } = await supabase.rpc('get_participant_summary', {
      p_participant_id: studentToken.participant_id,
      p_token: studentToken.token,
      p_session_id: id,
    })

    if (rpcError || !data) {
      setError('load-failed')
      setLoading(false)
      return
    }

    const summaryData = data as SummaryData
    setSummary(summaryData)

    // For scenario activities, load the chat transcript separately
    // (scenario turns are stored in scenario_messages, not responses)
    if (summaryData.activity_type === 'scenario_solo' || summaryData.activity_type === 'scenario_multi') {
      const { data: transcriptData } = await supabase.rpc('get_scenario_transcript', {
        p_participant_id: studentToken.participant_id,
        p_token: studentToken.token,
        p_session_id: id,
      })
      if (transcriptData?.messages) {
        setScenarioMessages(transcriptData.messages as ScenarioMessage[])
      }
    }

    setLoading(false)
  }, [id, studentToken])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-kiln-500" />
      </div>
    )
  }

  if (error === 'wrong-device') {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 animate-fade-in">
        <div className="p-4 bg-cyan-50 rounded-2xl w-fit mx-auto mb-5">
          <MessageSquare className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Open on your original device</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Your session summary is stored in your browser. Visit this page on the same device
          and browser you used to join the session.
        </p>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <p className="text-slate-500 text-sm">Could not load your summary. The session may not exist.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-kiln-600 hover:underline">Go home</Link>
      </div>
    )
  }

  const isScenario = summary.activity_type === 'scenario_solo' || summary.activity_type === 'scenario_multi'
  const studentScenarioMessages = scenarioMessages.filter((m) => m.speaker_type === 'student')
  const totalWords = isScenario
    ? studentScenarioMessages.reduce((sum, m) => sum + m.content.trim().split(/\s+/).filter(Boolean).length, 0)
    : summary.responses.reduce((sum, r) => sum + r.content.trim().split(/\s+/).filter(Boolean).length, 0)
  const roundsOrTurns = isScenario ? studentScenarioMessages.length : summary.responses.length
  const sessionDate = new Date(summary.session_date)
  const followUpMap = new Map(summary.follow_ups.map((f) => [f.round, f.prompt]))

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col gap-1 pt-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${ACTIVITY_COLORS[summary.activity_type] ?? 'bg-slate-100 text-slate-600'}`}>
          {ACTIVITY_LABELS[summary.activity_type] ?? summary.activity_type}
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">{summary.activity_title}</h1>
        <p className="text-sm text-slate-500">
          {summary.participant_name} · session{' '}
          <span className="font-mono font-semibold">{summary.join_code}</span> ·{' '}
          {sessionDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{roundsOrTurns}</p>
          <p className="text-xs text-slate-500 mt-0.5">{isScenario ? 'Turns taken' : 'Rounds completed'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{totalWords}</p>
          <p className="text-xs text-slate-500 mt-0.5">Words written</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {roundsOrTurns > 0 ? Math.round(totalWords / roundsOrTurns) : 0}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{isScenario ? 'Avg. per turn' : 'Avg. per round'}</p>
        </div>
      </div>

      {/* AI Feedback */}
      {summary.ai_feedback && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-3 animate-slide-up">
          <MessageSquare className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5">
              Instructor feedback
            </p>
            <p className="text-sm text-blue-900 leading-relaxed">{summary.ai_feedback}</p>
          </div>
        </div>
      )}

      {/* Scenario transcript */}
      {isScenario && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Your conversation
          </p>
          {scenarioMessages.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No transcript found for this session.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {scenarioMessages.map((msg) => {
                const isStudent = msg.speaker_type === 'student'
                return (
                  <div key={msg.turn} className={`flex gap-3 ${isStudent ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isStudent ? 'bg-kiln-100' : 'bg-slate-100'
                    }`}>
                      {isStudent
                        ? <User className="w-3.5 h-3.5 text-kiln-600" />
                        : <Users className="w-3.5 h-3.5 text-slate-500" />}
                    </div>
                    <div className={`flex flex-col gap-1 max-w-[85%] ${isStudent ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-slate-400 font-medium">{msg.speaker_name}</span>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isStudent
                          ? 'bg-kiln-600 text-white rounded-tr-sm'
                          : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Response chain (non-scenario activities) */}
      {!isScenario && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Your responses
          </p>
          <div className="flex flex-col gap-0">
            {summary.responses.map((r, i) => {
              const followUp = followUpMap.get(r.round)
              const isLast = i === summary.responses.length - 1
              const wc = r.content.trim().split(/\s+/).filter(Boolean).length
              return (
                <div key={r.round}>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {r.round}
                      </span>
                      {(!isLast || followUp) && (
                        <div className="w-px flex-1 bg-slate-200 mt-1 min-h-[1.5rem]" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-slate-400 font-medium">
                          {TYPE_LABELS[r.response_type] ?? r.response_type}
                        </span>
                        <span className="text-xs text-slate-300">{wc} words</span>
                        {r.time_taken_ms != null && (
                          <span className="text-xs text-slate-300">
                            {(r.time_taken_ms / 1000).toFixed(0)}s
                          </span>
                        )}
                      </div>
                      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
                        <p className="text-sm text-slate-700 leading-relaxed">{r.content}</p>
                      </div>
                    </div>
                  </div>
                  {/* AI follow-up shown between rounds for Socratic Chain */}
                  {followUp && (
                    <div className="flex gap-3 mb-1">
                      <div className="flex flex-col items-center">
                        <div className="w-px h-2 bg-slate-200" />
                        <span className="w-6 h-6 flex items-center justify-center shrink-0">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                        </span>
                        <div className="w-px flex-1 bg-slate-200" />
                      </div>
                      <div className="flex-1 py-2">
                        <p className="text-xs text-purple-500 font-medium mb-0.5">Your follow-up question</p>
                        <p className="text-xs text-slate-500 italic leading-relaxed">{followUp}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {summary.responses.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No responses found for this session.</p>
          )}
        </div>
      )}

      <p className="text-xs text-center text-slate-300 pb-6">
        Powered by Kiln · <a href="https://usekiln.org" className="hover:text-kiln-500 transition-colors">usekiln.org</a>
      </p>
    </div>
  )
}
