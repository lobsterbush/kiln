import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { SessionLobby } from '../components/shared/SessionLobby'
import { LiveMonitor } from '../components/instructor/LiveMonitor'
import type { Session, Activity, Participant, Response as KilnResponse } from '../lib/types'

export function InstructorSession() {
  const { id } = useParams<{ id: string }>()
  useAuth() // ensure instructor is authenticated
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [responses, setResponses] = useState<KilnResponse[]>([])

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
      setActivity(data.activity as Activity)
    }

    const { data: parts } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', id!)
    if (parts) setParticipants(parts)

    const { data: resps } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', id!)
    if (resps) setResponses(resps)
  }

  // Listen for new participants and responses
  useEffect(() => {
    if (!id) return

    const channel = supabase.channel(`instructor:${id}`)

    // Listen for new participants via postgres changes
    const participantSub = supabase
      .channel(`participants:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'participants',
        filter: `session_id=eq.${id}`,
      }, (payload) => {
        setParticipants((prev) => [...prev, payload.new as Participant])
      })
      .subscribe()

    const responseSub = supabase
      .channel(`responses:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'responses',
        filter: `session_id=eq.${id}`,
      }, (payload) => {
        setResponses((prev) => [...prev, payload.new as KilnResponse])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(participantSub)
      supabase.removeChannel(responseSub)
    }
  }, [id])

  const broadcastEvent = useCallback(
    async (event: string, payload: Record<string, unknown>) => {
      const channel = supabase.channel(`session:${id}`)
      await channel.subscribe()
      await channel.send({ type: 'broadcast', event, payload })
      supabase.removeChannel(channel)
    },
    [id]
  )

  async function startSession() {
    if (!session || !activity) return

    const now = new Date().toISOString()
    await supabase
      .from('sessions')
      .update({ status: 'active', current_round: 1, round_started_at: now })
      .eq('id', session.id)

    setSession((prev) => prev ? { ...prev, status: 'active', current_round: 1, round_started_at: now } : null)

    await broadcastEvent('session:status', { status: 'active' })
    await broadcastEvent('round:start', {
      round: 1,
      duration_sec: activity.config.round_duration_sec,
      prompt: activity.config.initial_prompt,
      server_timestamp: now,
    })
  }

  async function advanceRound() {
    if (!session || !activity) return

    const nextRound = session.current_round + 1
    if (nextRound > activity.config.rounds) {
      await endSession()
      return
    }

    const now = new Date().toISOString()

    // For peer critique: assign peers before starting next round
    if (activity.type === 'peer_critique' && session.current_round >= 1) {
      await assignPeers()
    }

    // For socratic chain: generate follow-ups
    if (activity.type === 'socratic_chain') {
      await generateFollowUps()
    }

    await supabase
      .from('sessions')
      .update({ current_round: nextRound, round_started_at: now, status: 'active' })
      .eq('id', session.id)

    setSession((prev) => prev ? { ...prev, current_round: nextRound, round_started_at: now, status: 'active' } : null)

    const prompt = activity.type === 'peer_critique'
      ? nextRound === 2
        ? 'Identify the weakest assumption in this argument.'
        : 'Respond to this specific criticism.'
      : 'Follow-up question will appear shortly.'

    await broadcastEvent('round:start', {
      round: nextRound,
      duration_sec: activity.config.round_duration_sec,
      prompt,
      server_timestamp: now,
    })
  }

  async function assignPeers() {
    if (!session) return
    const currentResponses = responses.filter((r) => r.round === session.current_round)
    if (currentResponses.length < 2) return

    // Round-robin shuffle
    const shuffled = [...currentResponses].sort(() => Math.random() - 0.5)
    for (let i = 0; i < shuffled.length; i++) {
      const reviewer = shuffled[i]
      const author = shuffled[(i + 1) % shuffled.length]
      const authorParticipant = participants.find((p) => p.id === author.participant_id)

      await supabase.from('peer_assignments').insert({
        session_id: session.id,
        round: session.current_round,
        reviewer_id: reviewer.participant_id,
        author_id: author.participant_id,
        response_id: author.id,
      })

      await broadcastEvent('peer:assigned', {
        participant_id: reviewer.participant_id,
        response_content: author.content,
        author_name: authorParticipant?.display_name ?? 'A classmate',
      })
    }
  }

  async function generateFollowUps() {
    if (!session) return
    const currentResponses = responses.filter((r) => r.round === session.current_round)

    for (const response of currentResponses) {
      try {
        const { data } = await supabase.functions.invoke('generate-followup', {
          body: {
            response_id: response.id,
            session_id: session.id,
            participant_id: response.participant_id,
            round: session.current_round,
          },
        })

        if (data?.prompt) {
          await broadcastEvent('followup:ready', {
            participant_id: response.participant_id,
            prompt: data.prompt,
          })
        }
      } catch (err) {
        console.error('Failed to generate follow-up:', err)
      }
    }
  }

  async function endSession() {
    if (!session) return
    await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', session.id)

    await broadcastEvent('session:status', { status: 'completed' })
    navigate(`/instructor/results/${session.id}`)
  }


  if (!session || !activity) {
    return <div className="flex justify-center py-20 text-slate-500">Loading session...</div>
  }

  if (session.status === 'lobby') {
    return (
      <SessionLobby
        joinCode={session.join_code}
        participants={participants}
        isInstructor={true}
        onStart={startSession}
      />
    )
  }

  if (session.status === 'completed') {
    navigate(`/instructor/results/${session.id}`)
    return null
  }

  return (
    <LiveMonitor
      participants={participants}
      responses={responses}
      currentRound={session.current_round}
      serverTimestamp={session.round_started_at}
      durationSec={activity.config.round_duration_sec}
      onAdvanceRound={advanceRound}
      onEndSession={endSession}
      sessionStatus={session.status}
    />
  )
}
