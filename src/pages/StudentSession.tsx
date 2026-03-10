import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getStudentToken } from '../lib/utils'
import { SessionLobby } from '../components/shared/SessionLobby'
import { ResponsePanel } from '../components/student/ResponsePanel'
import { PeerCritiqueView } from '../components/student/PeerCritiqueView'
import { SocraticView } from '../components/student/SocraticView'
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
  const [peerResponseType, setPeerResponseType] = useState<'critique' | 'rebuttal'>('critique')
  const [myResponses, setMyResponses] = useState<{ round: number; prompt: string; content: string }[]>([])
  const [previousResponse, setPreviousResponse] = useState('')
  const [waitingForNext, setWaitingForNext] = useState(false)
  const [followUpLoading, setFollowUpLoading] = useState(false)

  // Restore response history from sessionStorage on mount (survives page refresh)
  useEffect(() => {
    if (!id) return
    const stored = sessionStorage.getItem(`kiln_responses_${id}`)
    if (stored) {
      try { setMyResponses(JSON.parse(stored)) } catch {}
    }
  }, [id])

  // Persist response history to sessionStorage whenever it changes
  useEffect(() => {
    if (!id || myResponses.length === 0) return
    sessionStorage.setItem(`kiln_responses_${id}`, JSON.stringify(myResponses))
  }, [myResponses, id])

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
    if (data) {
      setSession(data)
      const act = data.activity as Activity
      setActivity(act)
      // Only synthesise a round event for late-joiners on round 1.
      // Rounds 2+ require peer assignments that have already been sent — show waiting.
      if (data.status === 'active' && data.round_started_at && data.current_round === 1) {
        setRoundEvent({
          round: 1,
          duration_sec: act.config.round_duration_sec,
          prompt: act.config.initial_prompt,
          server_timestamp: data.round_started_at,
        })
      }
      // Show correct waiting message for students who load mid-session (round 2+ or between rounds)
      if (data.status === 'between_rounds' || (data.status === 'active' && data.current_round > 1)) {
        setWaitingForNext(true)
      }
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
        const event = payload as RoundStartEvent
        setRoundEvent(event)
        setPeerResponse(null)
        setFollowUp(null)
        setWaitingForNext(false)
        setFollowUpLoading(false)
      })
      .on('broadcast', { event: 'round:end' }, () => {
        setWaitingForNext(true)
      })
      .on('broadcast', { event: 'peer:assigned' }, ({ payload }) => {
        if (payload.participant_id === studentToken.participant_id) {
          setPeerResponse({ content: payload.response_content, name: payload.author_name })
          setPeerResponseType(payload.response_type === 'rebuttal' ? 'rebuttal' : 'critique')
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
      .on('broadcast', { event: 'participant:joined' }, () => {
        loadSession()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, studentToken?.participant_id])

  const handleSubmitResponse = useCallback(
    async (content: string, timeTakenMs: number) => {
      if (!studentToken || !roundEvent || !id) return

      const responseType =
        followUp ? 'followup_answer' :
        peerResponse ? peerResponseType :
        'initial'

      await supabase.from('responses').insert({
        session_id: id,
        participant_id: studentToken.participant_id,
        round: roundEvent.round,
        content,
        response_type: responseType,
        time_taken_ms: timeTakenMs,
      })

      setMyResponses((prev) => [...prev, { round: roundEvent.round, prompt: roundEvent.prompt, content }])
      setPreviousResponse(content)
      setWaitingForNext(true)

      if (activity?.type === 'socratic_chain') {
        setFollowUpLoading(true)
      }
    },
    [studentToken, roundEvent, id, peerResponse, peerResponseType, followUp, activity]
  )

  // Blank screen while redirect fires (from the validation useEffect above)
  if (!studentToken || studentToken.session_id !== id) {
    return null
  }

  if (!session || !activity) {
    return <div className="flex justify-center py-20 text-slate-500">Loading session...</div>
  }

  // Lobby
  if (session.status === 'lobby') {
    return (
      <SessionLobby
        joinCode={session.join_code}
        participants={participants}
        isInstructor={false}
      />
    )
  }

  // Completed
  if (session.status === 'completed') {
    return (
      <div className="flex flex-col items-center gap-8 py-16 animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Complete</h2>
          <p className="text-slate-500">Here's what you wrote this session.</p>
        </div>
        {myResponses.length > 0 ? (
          <div className="w-full max-w-lg flex flex-col gap-4">
            {myResponses.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center">{r.round}</span>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Round {r.round}</p>
                </div>
                <p className="text-xs text-slate-400 mb-2 italic line-clamp-2">{r.prompt}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{r.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No responses recorded this session.</p>
        )}
      </div>
    )
  }

  // Waiting between rounds
  if (waitingForNext && !peerResponse && !followUp && !followUpLoading) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 animate-pulse text-lg">Waiting for next round...</p>
      </div>
    )
  }

  // Active round
  if (roundEvent) {
    // Peer critique round 2+: waiting for the peer:assigned broadcast to arrive
    if (activity.type === 'peer_critique' && roundEvent.round > 1 && !peerResponse) {
      return (
        <div className="flex flex-col items-center gap-4 py-20 animate-fade-in">
          <div className="p-4 bg-blue-50 rounded-2xl">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
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

    // Socratic chain: show AI follow-up
    if ((followUp || followUpLoading) && activity.type === 'socratic_chain') {
      return (
        <SocraticView
          followUpPrompt={followUp}
          previousResponse={previousResponse}
          round={roundEvent.round}
          serverTimestamp={roundEvent.server_timestamp}
          durationSec={roundEvent.duration_sec}
          onSubmit={handleSubmitResponse}
          loading={followUpLoading}
        />
      )
    }

    // Default: initial response
    return (
      <ResponsePanel
        prompt={roundEvent.prompt}
        serverTimestamp={roundEvent.server_timestamp}
        durationSec={roundEvent.duration_sec}
        onSubmit={handleSubmitResponse}
      />
    )
  }

  return <div className="text-center py-20 text-slate-500">Waiting for session to begin...</div>
}
