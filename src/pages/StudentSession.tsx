import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getStudentToken } from '../lib/utils'
import { SessionLobby } from '../components/shared/SessionLobby'
import { ResponsePanel } from '../components/student/ResponsePanel'
import { PeerCritiqueView } from '../components/student/PeerCritiqueView'
import { SocraticView } from '../components/student/SocraticView'
import type { Session, Participant, Activity, RoundStartEvent } from '../lib/types'

export function StudentSession() {
  const { id } = useParams<{ id: string }>()
  const studentToken = getStudentToken()

  const [session, setSession] = useState<Session | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [roundEvent, setRoundEvent] = useState<RoundStartEvent | null>(null)
  const [peerResponse, setPeerResponse] = useState<{ content: string; name: string } | null>(null)
  const [followUp, setFollowUp] = useState<string | null>(null)
  const [previousResponse, setPreviousResponse] = useState('')
  const [waitingForNext, setWaitingForNext] = useState(false)
  const [followUpLoading, setFollowUpLoading] = useState(false)

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
      // Reconstruct round state for students joining a session already in progress
      if (data.status === 'active' && data.round_started_at) {
        setRoundEvent({
          round: data.current_round,
          duration_sec: act.config.round_duration_sec,
          prompt: data.current_round === 1
            ? act.config.initial_prompt
            : 'Session in progress — respond to the current prompt.',
          server_timestamp: data.round_started_at,
        })
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
        peerResponse ? 'critique' :
        followUp ? 'followup_answer' :
        'initial'

      await supabase.from('responses').insert({
        session_id: id,
        participant_id: studentToken.participant_id,
        round: roundEvent.round,
        content,
        response_type: responseType,
        time_taken_ms: timeTakenMs,
      })

      setPreviousResponse(content)
      setWaitingForNext(true)

      if (activity?.type === 'socratic_chain') {
        setFollowUpLoading(true)
      }
    },
    [studentToken, roundEvent, id, peerResponse, followUp, activity]
  )

  if (!studentToken) {
    return <div className="text-center py-20 text-slate-500">Session not found. Please join again.</div>
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
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Complete</h2>
        <p className="text-slate-500">Thanks for participating!</p>
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
    // Peer critique: show peer's response
    if (peerResponse && activity.type === 'peer_critique') {
      return (
        <PeerCritiqueView
          peerResponse={peerResponse.content}
          peerName={peerResponse.name}
          critiquePrompt="Identify the weakest assumption in this argument."
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
