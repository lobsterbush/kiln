import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, WifiOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getStudentToken } from '../lib/utils'
import { SessionLobby } from '../components/shared/SessionLobby'
import { ResponsePanel } from '../components/student/ResponsePanel'
import { PeerCritiqueView } from '../components/student/PeerCritiqueView'
import { PeerClarificationView } from '../components/student/PeerClarificationView'
import { EvidenceAnalysisView } from '../components/student/EvidenceAnalysisView'
import { SocraticView } from '../components/student/SocraticView'
import { DEFAULT_CRITIQUE_PROMPT, DEFAULT_REBUTTAL_PROMPT, DEFAULT_EXPLAIN_PROMPT, DEFAULT_GAP_PROMPT, FOLLOW_UP_TIMEOUT_MS } from '../lib/constants'
import type { Session, Participant, Activity, RoundStartEvent } from '../lib/types'

export function StudentSession() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const studentToken = getStudentToken()

  // Redirect to join if there is no token or if it belongs to a different session
  useEffect(() => {
    if (!studentToken || studentToken.session_id !== id) {
      navigate('/join', { replace: true })
    }
  }, [])

  const [session, setSession] = useState<Session | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [roundEvent, setRoundEvent] = useState<RoundStartEvent | null>(null)
  const [peerResponse, setPeerResponse] = useState<{ content: string; name: string } | null>(null)
  const [followUp, setFollowUp] = useState<string | null>(null)
  const [peerResponseType, setPeerResponseType] = useState<'critique' | 'rebuttal' | 'clarification' | 'evidence_gap'>('critique')
  const [myResponses, setMyResponses] = useState<{ round: number; prompt: string; content: string }[]>([])
  const [previousResponse, setPreviousResponse] = useState('')
  const [waitingForNext, setWaitingForNext] = useState(false)
  const [followUpLoading, setFollowUpLoading] = useState(false)
  const [followUpTimedOut, setFollowUpTimedOut] = useState(false)
  const [disconnected, setDisconnected] = useState(false)
  const followUpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const subscribedOnceRef = useRef(false)

  // Restore response history from sessionStorage on mount (survives page refresh)
  useEffect(() => {
    if (!id) return
    const stored = sessionStorage.getItem(`kiln_responses_${id}`)
    if (stored) {
      try {
        const saved = JSON.parse(stored) as { round: number; prompt: string; content: string }[]
        setMyResponses(saved)
        // Restore last response for Socratic chain follow-up context
        if (saved.length > 0) setPreviousResponse(saved[saved.length - 1].content)
      } catch {}
    }
  }, [id])

  // Persist response history to sessionStorage whenever it changes
  useEffect(() => {
    if (!id || myResponses.length === 0) return
    sessionStorage.setItem(`kiln_responses_${id}`, JSON.stringify(myResponses))
  }, [myResponses, id])

  // Follow-up timeout: if Claude doesn't respond within FOLLOW_UP_TIMEOUT_MS, show fallback
  useEffect(() => {
    if (followUpLoading) {
      followUpTimeoutRef.current = setTimeout(() => {
        setFollowUpLoading(false)
        setFollowUpTimedOut(true)
      }, FOLLOW_UP_TIMEOUT_MS)
    } else {
      if (followUpTimeoutRef.current) {
        clearTimeout(followUpTimeoutRef.current)
        followUpTimeoutRef.current = null
      }
    }
    return () => {
      if (followUpTimeoutRef.current) clearTimeout(followUpTimeoutRef.current)
    }
  }, [followUpLoading])

  // Load session data
  useEffect(() => {
    if (!id) return
    loadSession()
  }, [id])

  async function loadSession() {
    const { data } = await supabase
      .from('sessions')
      .select('*, activity:activities(*)')
      .eq('id', id)
      .single()

    if (!data) return

    setSession(data)
    const act = data.activity as Activity
    setActivity(act)

    if (data.status === 'active' && data.round_started_at) {
      if (data.current_round === 1) {
        // Late-joiner on round 1 — synthesise event directly
        setRoundEvent({
          round: 1,
          duration_sec: act.config.round_duration_sec,
          prompt: act.config.initial_prompt,
          server_timestamp: data.round_started_at,
        })
      } else {
        // Round 2+: use the secure RPC for recovery (validates token server-side)
        const { data: ctx, error } = await supabase.rpc('get_student_round_context', {
          p_participant_id: studentToken!.participant_id,
          p_token: studentToken!.token,
          p_session_id: id!,
          p_round: data.current_round,
          p_activity_type: act.type,
        })

        if (error || !ctx) {
          setWaitingForNext(true)
        } else if (ctx.already_submitted) {
          setWaitingForNext(true)
        } else if (ctx.peer_response_content) {
          const prompt =
            ctx.peer_response_type === 'rebuttal' ? (act.config.rebuttal_prompt ?? DEFAULT_REBUTTAL_PROMPT) :
            ctx.peer_response_type === 'clarification' ? (act.config.explain_prompt ?? DEFAULT_EXPLAIN_PROMPT) :
            ctx.peer_response_type === 'evidence_gap' ? (act.config.gap_prompt ?? DEFAULT_GAP_PROMPT) :
            (act.config.critique_prompt ?? DEFAULT_CRITIQUE_PROMPT)
          setRoundEvent({
            round: data.current_round,
            duration_sec: act.config.round_duration_sec,
            prompt,
            server_timestamp: data.round_started_at,
          })
          setPeerResponse({ content: ctx.peer_response_content, name: ctx.peer_name })
          setPeerResponseType(ctx.peer_response_type as 'critique' | 'rebuttal' | 'clarification' | 'evidence_gap')
        } else if (ctx.follow_up_prompt) {
          setRoundEvent({
            round: data.current_round,
            duration_sec: act.config.round_duration_sec,
            prompt: ctx.follow_up_prompt,
            server_timestamp: data.round_started_at,
          })
          setFollowUp(ctx.follow_up_prompt)
        } else {
          setWaitingForNext(true)
        }
      }
    }

    if (data.status === 'between_rounds') {
      setWaitingForNext(true)
    }

    const { data: parts } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', id!)
      .eq('is_active', true)
    if (parts) setParticipants(parts)
  }

  // Subscribe to realtime
  useEffect(() => {
    if (!id || !studentToken) return

    const channel = supabase.channel(`session:${id}`)

    channel
      .on('broadcast', { event: 'round:start' }, ({ payload }) => {
        setDisconnected(false)
        const event = payload as RoundStartEvent
        setRoundEvent(event)
        setPeerResponse(null)
        setFollowUp(null)
        setWaitingForNext(false)
        setFollowUpLoading(false)
      })
      .on('broadcast', { event: 'peer:assigned' }, ({ payload }) => {
        if (payload.participant_id === studentToken.participant_id) {
          setPeerResponse({ content: payload.response_content, name: payload.author_name })
          setPeerResponseType(payload.response_type as 'critique' | 'rebuttal' | 'clarification' | 'evidence_gap')
          setWaitingForNext(false)
        }
      })
      .on('broadcast', { event: 'followup:ready' }, ({ payload }) => {
        if (payload.participant_id === studentToken.participant_id) {
          setFollowUp(payload.prompt)
          setFollowUpLoading(false)
          setWaitingForNext(false)
        }
      })
      .on('broadcast', { event: 'session:status' }, ({ payload }) => {
        setSession((prev) => prev ? { ...prev, status: payload.status } : null)
        if (payload.status === 'completed') {
          setRoundEvent(null)
        }
      })
      .on('broadcast', { event: 'participant:joined' }, ({ payload }) => {
        setParticipants((prev) => {
          if (prev.some((p) => p.id === payload.participant_id)) return prev
          return [...prev, {
            id: payload.participant_id,
            display_name: payload.display_name,
            session_id: id!,
            token: '',
            joined_at: new Date().toISOString(),
            is_active: true,
          }]
        })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setDisconnected(false)
          // After the first subscription, subsequent SUBSCRIBED events are reconnects
          if (subscribedOnceRef.current) {
            loadSession()
          }
          subscribedOnceRef.current = true
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setDisconnected(true)
        }
      })

    return () => {
      subscribedOnceRef.current = false
      supabase.removeChannel(channel)
    }
  }, [id, studentToken?.participant_id])

  const handleSubmitResponse = useCallback(
    async (content: string, timeTakenMs: number) => {
      if (!studentToken || !roundEvent || !id) return

      const responseType =
        followUp || followUpTimedOut ? 'followup_answer' :
        peerResponse ? peerResponseType :
        'initial'

      // Use the token-validated RPC instead of a direct insert
      const { error: rpcError } = await supabase.rpc('submit_response', {
        p_token: studentToken.token,
        p_session_id: id,
        p_participant_id: studentToken.participant_id,
        p_round: roundEvent.round,
        p_content: content,
        p_response_type: responseType,
        p_time_taken_ms: timeTakenMs,
      })

      if (rpcError) throw new Error('Failed to save response')

      setMyResponses((prev) => [...prev, { round: roundEvent.round, prompt: roundEvent.prompt, content }])
      setPreviousResponse(content)
      setFollowUpTimedOut(false)
      setWaitingForNext(true)

      if (activity?.type === 'socratic_chain') {
        setFollowUpLoading(true)
      }
    },
    [studentToken, roundEvent, id, peerResponse, peerResponseType, followUp, followUpTimedOut, activity]
  )

  // Blank screen while redirect fires (from the validation useEffect above)
  if (!studentToken || studentToken.session_id !== id) {
    return null
  }

  if (!session || !activity) {
    return <div className="flex justify-center py-20 text-slate-500">Loading session...</div>
  }

  // Disconnected banner (shown inline, doesn't block the UI)
  const disconnectedBanner = disconnected && (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 mb-4">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Connection lost — reconnecting...</span>
    </div>
  )

  // Lobby
  if (session.status === 'lobby') {
    return (
      <>
        {disconnectedBanner}
      <SessionLobby
        joinCode={session.join_code}
        participants={participants}
        isInstructor={false}
        activityTitle={activity.title}
      />
      </>
    )
  }

  // Completed
  if (session.status === 'completed') {
    const totalWords = myResponses.reduce((sum, r) => sum + r.content.trim().split(/\s+/).filter(Boolean).length, 0)
    return (
      <div className="flex flex-col items-center gap-8 py-12 animate-fade-in">
        <div className="text-center">
          <div className="text-4xl mb-4">🔥</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Complete</h2>
          {myResponses.length > 0 ? (
            <p className="text-slate-500">
              You wrote <span className="font-semibold text-kiln-600">{totalWords} words</span> across {myResponses.length} round{myResponses.length !== 1 ? 's' : ''}.
            </p>
          ) : (
            <p className="text-slate-500">Session ended.</p>
          )}
        </div>
        {myResponses.length > 0 && (
          <div className="w-full max-w-lg flex flex-col gap-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Your responses this session</p>
            {myResponses.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center">{r.round}</span>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Round {r.round}</p>
                  </div>
                  <span className="text-xs text-slate-300">
                    {r.content.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2 italic">{r.prompt}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Waiting between rounds
  if (waitingForNext && !peerResponse && !followUp && !followUpLoading && !followUpTimedOut) {
    const lastResponse = myResponses.length > 0 ? myResponses[myResponses.length - 1] : null
    const completedRound = lastResponse?.round ?? (roundEvent?.round ?? 0)
    const totalRounds = activity.config.rounds
    const isLastRound = completedRound >= totalRounds

    const nextHint = isLastRound ? null :
      activity.type === 'peer_critique' && completedRound === 1
        ? "Next, you'll receive a classmate's argument to critique."
        : activity.type === 'peer_critique' && completedRound === 2
        ? "Next, you'll see a critique of your argument and write a rebuttal."
        : activity.type === 'peer_clarification' && completedRound === 1
        ? "Next, you'll receive a classmate's confusion to explain in plain language."
        : activity.type === 'evidence_analysis' && completedRound === 1
        ? "Next, you'll identify the inferential gap in a classmate's interpretation."
        : activity.type === 'socratic_chain'
        ? "Your personalised follow-up question is being prepared…"
        : "The next round is coming up."

    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        {/* Submitted confirmation */}
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <span className="text-emerald-500 text-lg">✓</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">
              {isLastRound ? 'All done — waiting for the session to wrap up.' : 'Submitted!'}
            </p>
            {!isLastRound && (
              <p className="text-xs text-emerald-600 mt-0.5">
                Round {completedRound} of {totalRounds} complete
              </p>
            )}
          </div>
          {/* Round progress dots */}
          <div className="flex gap-1 shrink-0">
            {Array.from({ length: totalRounds }, (_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < completedRound ? 'bg-emerald-400' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* What they wrote */}
        {lastResponse && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Round {completedRound} response</p>
            <p className="text-sm text-slate-700 leading-relaxed">{lastResponse.content}</p>
            <p className="text-xs text-slate-300 mt-2">
              {lastResponse.content.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
        )}

        {/* What's coming */}
        {nextHint && (
          <div className="flex items-start gap-3 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-slate-400 text-base mt-0.5">→</span>
            <p className="text-sm text-slate-600">{nextHint}</p>
          </div>
        )}

        <p className="text-xs text-center text-slate-400 animate-pulse">Waiting for instructor…</p>
      </div>
    )
  }

  // Active round
  if (roundEvent) {
    // Peer-assignment types: waiting for the peer:assigned broadcast to arrive
    const isPeerAssignmentType = activity.type === 'peer_critique' || activity.type === 'peer_clarification' || activity.type === 'evidence_analysis'
    if (isPeerAssignmentType && roundEvent.round > 1 && !peerResponse) {
      const spinColor = activity.type === 'peer_clarification' ? 'bg-teal-50' : activity.type === 'evidence_analysis' ? 'bg-amber-50' : 'bg-blue-50'
      const iconColor = activity.type === 'peer_clarification' ? 'text-teal-500' : activity.type === 'evidence_analysis' ? 'text-amber-500' : 'text-blue-500'
      return (
        <div className="flex flex-col items-center gap-4 py-20 animate-fade-in">
          <div className={`p-4 ${spinColor} rounded-2xl`}>
            <Loader2 className={`w-8 h-8 ${iconColor} animate-spin`} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Receiving your peer assignment…</p>
        </div>
      )
    }

    // Peer critique: show peer's response
    if (peerResponse && activity.type === 'peer_critique') {
      return (
        <PeerCritiqueView
          peerResponse={peerResponse.content}
          peerName={peerResponse.name}
          critiquePrompt={roundEvent.prompt}
          serverTimestamp={roundEvent.server_timestamp}
          durationSec={roundEvent.duration_sec}
          onSubmit={handleSubmitResponse}
        />
      )
    }

    // Peer clarification: show peer's confusion
    if (peerResponse && activity.type === 'peer_clarification') {
      return (
        <PeerClarificationView
          peerResponse={peerResponse.content}
          peerName={peerResponse.name}
          explainPrompt={roundEvent.prompt}
          serverTimestamp={roundEvent.server_timestamp}
          durationSec={roundEvent.duration_sec}
          onSubmit={handleSubmitResponse}
        />
      )
    }

    // Evidence analysis: show peer's interpretation
    if (peerResponse && activity.type === 'evidence_analysis') {
      return (
        <EvidenceAnalysisView
          peerResponse={peerResponse.content}
          peerName={peerResponse.name}
          gapPrompt={roundEvent.prompt}
          serverTimestamp={roundEvent.server_timestamp}
          durationSec={roundEvent.duration_sec}
          onSubmit={handleSubmitResponse}
        />
      )
    }

    // Socratic chain: show AI follow-up (or fallback if timed out)
    if ((followUp || followUpLoading || followUpTimedOut) && activity.type === 'socratic_chain') {
      return (
        <SocraticView
          followUpPrompt={followUp}
          previousResponse={previousResponse}
          round={roundEvent.round}
          serverTimestamp={roundEvent.server_timestamp}
          durationSec={roundEvent.duration_sec}
          onSubmit={handleSubmitResponse}
          loading={followUpLoading}
          timedOut={followUpTimedOut}
        />
      )
    }

    // Default: initial response
    return (
      <>
        {disconnectedBanner}
        <ResponsePanel
          prompt={roundEvent.prompt}
          serverTimestamp={roundEvent.server_timestamp}
          durationSec={roundEvent.duration_sec}
          onSubmit={handleSubmitResponse}
        />
      </>
    )
  }

  return <div className="text-center py-20 text-slate-500">Waiting for session to begin...</div>
}
