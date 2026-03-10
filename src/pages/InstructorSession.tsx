import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { SessionLobby } from '../components/shared/SessionLobby'
import { LiveMonitor } from '../components/instructor/LiveMonitor'
import type { Session, Activity, Participant, Response as KilnResponse } from '../lib/types'

export function InstructorSession() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [responses, setResponses] = useState<KilnResponse[]>([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/instructor')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!id || !user) return
    loadSession()
  }, [id, user])

  async function loadSession() {
    const { data } = await supabase
      .from('sessions')
      .select('*, activity:activities(*)')
      .eq('id', id)
      .eq('instructor_id', user!.id)
      .single()
    if (!data) {
      navigate('/instructor')
      return
    }
    setSession(data)
    const act = data.activity as Activity
    setActivity(act)
    // Reconstruct prompt for active round 1 on page reload
    if (data.status === 'active' && data.current_round === 1) {
      setCurrentPrompt(act.config.initial_prompt)
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

  // Listen for new participants and responses; set up persistent broadcast channel
  useEffect(() => {
    if (!id) return

    // Persistent channel for broadcasting events to students
    const bc = supabase.channel(`session:${id}`)
    bc.subscribe()
    broadcastChannelRef.current = bc

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
      supabase.removeChannel(bc)
      broadcastChannelRef.current = null
      supabase.removeChannel(participantSub)
      supabase.removeChannel(responseSub)
    }
  }, [id])

  const broadcastEvent = useCallback(
    async (event: string, payload: Record<string, unknown>) => {
      await broadcastChannelRef.current?.send({ type: 'broadcast', event, payload })
    },
    []
  )

  async function handleRoundExpire() {
    if (!session) return
    await supabase
      .from('sessions')
      .update({ status: 'between_rounds' })
      .eq('id', session.id)
    setSession((prev) => prev ? { ...prev, status: 'between_rounds' } : null)
  }

  async function startSession(customPrompt?: string) {
    if (!session || !activity) return

    const now = new Date().toISOString()
    await supabase
      .from('sessions')
      .update({ status: 'active', current_round: 1, round_started_at: now })
      .eq('id', session.id)

    const prompt = customPrompt ?? activity.config.initial_prompt
    setSession((prev) => prev ? { ...prev, status: 'active', current_round: 1, round_started_at: now } : null)
    setCurrentPrompt(prompt)

    await broadcastEvent('session:status', { status: 'active' })
    await broadcastEvent('round:start', {
      round: 1,
      duration_sec: activity.config.round_duration_sec,
      prompt,
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

    // Fetch fresh responses from DB to avoid stale state race condition
    const { data: freshResponses } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', session.id)
      .eq('round', session.current_round)
    const currentResponses = freshResponses ?? []

    const now = new Date().toISOString()
    await supabase
      .from('sessions')
      .update({ current_round: nextRound, round_started_at: now, status: 'active' })
      .eq('id', session.id)
    setSession((prev) => prev ? { ...prev, current_round: nextRound, round_started_at: now, status: 'active' } : null)

    if (activity.type === 'peer_critique') {
      if (nextRound === 2) {
        const prompt = 'Read the argument below carefully. Identify its weakest assumption or unsupported claim.'
        setCurrentPrompt(prompt)
        await broadcastEvent('round:start', { round: nextRound, duration_sec: activity.config.round_duration_sec, prompt, server_timestamp: now })
        await assignPeers(currentResponses, session.current_round)
      } else if (nextRound === 3) {
        const prompt = 'Below is a peer\'s critique of your original argument. Write a rebuttal defending your position.'
        setCurrentPrompt(prompt)
        await broadcastEvent('round:start', { round: nextRound, duration_sec: activity.config.round_duration_sec, prompt, server_timestamp: now })
        await assignRebuttals(currentResponses, session.current_round)
      } else {
        const prompt = 'Continue developing your argument based on the discussion so far.'
        setCurrentPrompt(prompt)
        await broadcastEvent('round:start', { round: nextRound, duration_sec: activity.config.round_duration_sec, prompt, server_timestamp: now })
      }
    } else if (activity.type === 'socratic_chain') {
      const prompt = 'Your personalised follow-up question is being generated…'
      setCurrentPrompt(prompt)
      await broadcastEvent('round:start', { round: nextRound, duration_sec: activity.config.round_duration_sec, prompt, server_timestamp: now })
      await generateFollowUps(currentResponses, session.current_round)
    }
  }

  async function assignPeers(currentResponses: KilnResponse[], fromRound: number) {
    if (!session || currentResponses.length < 2) return
    const shuffled = [...currentResponses].sort(() => Math.random() - 0.5)

    // Bulk insert all assignments in one round trip
    const insertRows = shuffled.map((reviewer, i) => {
      const author = shuffled[(i + 1) % shuffled.length]
      return {
        session_id: session!.id,
        round: fromRound,
        reviewer_id: reviewer.participant_id,
        author_id: author.participant_id,
        response_id: author.id,
      }
    })
    await supabase.from('peer_assignments').insert(insertRows)

    // Broadcast each reviewer their assigned response
    for (const row of insertRows) {
      const authorResponse = currentResponses.find((r) => r.id === row.response_id)
      const authorParticipant = participants.find((p) => p.id === row.author_id)
      await broadcastEvent('peer:assigned', {
        participant_id: row.reviewer_id,
        response_content: authorResponse?.content ?? '',
        author_name: authorParticipant?.display_name ?? 'A classmate',
        response_type: 'critique',
      })
    }
  }

  async function assignRebuttals(critiqueResponses: KilnResponse[], fromRound: number) {
    if (!session) return
    // Look up who critiqued whom in the previous round
    const { data: prevAssignments } = await supabase
      .from('peer_assignments')
      .select('*')
      .eq('session_id', session.id)
      .eq('round', fromRound - 1)
    if (!prevAssignments) return

    for (const assignment of prevAssignments) {
      const critique = critiqueResponses.find((r) => r.participant_id === assignment.reviewer_id)
      if (!critique) continue
      // Send the original author the critique of their work
      await broadcastEvent('peer:assigned', {
        participant_id: assignment.author_id,
        response_content: critique.content,
        author_name: 'Peer critique',
        response_type: 'rebuttal',
      })
    }
  }

  async function generateFollowUps(currentResponses: KilnResponse[], fromRound: number) {
    if (!session) return
    await Promise.all(
      currentResponses.map(async (response) => {
        try {
          const { data } = await supabase.functions.invoke('generate-followup', {
            body: {
              response_id: response.id,
              session_id: session!.id,
              participant_id: response.participant_id,
              round: fromRound,
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
      })
    )
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


  if (authLoading || (!user && !authLoading)) {
    return <div className="flex justify-center py-20 text-slate-500">Loading...</div>
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
        initialPrompt={activity.config.initial_prompt}
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
      roundPrompt={currentPrompt}
      serverTimestamp={session.round_started_at}
      durationSec={activity.config.round_duration_sec}
      onAdvanceRound={advanceRound}
      onEndSession={endSession}
      onRoundExpire={handleRoundExpire}
      sessionStatus={session.status}
    />
  )
}
