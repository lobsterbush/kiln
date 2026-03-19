import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { shuffleArray } from '../lib/utils'
import { DEFAULT_CRITIQUE_PROMPT, DEFAULT_REBUTTAL_PROMPT, DEFAULT_EXPLAIN_PROMPT, DEFAULT_GAP_PROMPT, FALLBACK_FOLLOW_UP_PROMPT } from '../lib/constants'
import { SessionLobby } from '../components/shared/SessionLobby'
import { LiveMonitor } from '../components/instructor/LiveMonitor'
import { ScenarioMonitor } from '../components/instructor/ScenarioMonitor'
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
  const [advancing, setAdvancing] = useState(false)
  const [peerWarning, setPeerWarning] = useState<string | null>(null)
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  // useRef guard prevents double-fire if two clicks land before setAdvancing batches
  const advancingRef = useRef(false)

  useEffect(() => {
    if (!authLoading && !user) navigate('/instructor')
  }, [user, authLoading, navigate])

  const loadSession = useCallback(async () => {
    if (!id || !user) return
    const [sessResult, partsResult, respsResult] = await Promise.all([
      supabase.from('sessions').select('*, activity:activities(*)')
        .eq('id', id).eq('instructor_id', user!.id).single(),
      supabase.from('participants').select('*').eq('session_id', id!),
      supabase.from('responses').select('*').eq('session_id', id!),
    ])

    if (!sessResult.data) {
      navigate('/instructor')
      return
    }
    setSession(sessResult.data)
    const act = sessResult.data.activity as Activity
    setActivity(act)
    // Reconstruct prompt for active session on page reload
    if (sessResult.data.status === 'active') {
      const round = sessResult.data.current_round
      if (round === 1) {
        setCurrentPrompt(act.config.initial_prompt)
      } else if (act.type === 'peer_critique') {
        if (round === 2) setCurrentPrompt(act.config.critique_prompt ?? DEFAULT_CRITIQUE_PROMPT)
        else if (round === 3) setCurrentPrompt(act.config.rebuttal_prompt ?? DEFAULT_REBUTTAL_PROMPT)
        else setCurrentPrompt('Continue developing your argument based on the discussion so far.')
      } else if (act.type === 'peer_clarification') {
        setCurrentPrompt(act.config.explain_prompt ?? DEFAULT_EXPLAIN_PROMPT)
      } else if (act.type === 'evidence_analysis') {
        setCurrentPrompt(act.config.gap_prompt ?? DEFAULT_GAP_PROMPT)
      } else if (act.type === 'socratic_chain') {
        setCurrentPrompt('Your personalised follow-up question is being generated…')
      } else {
        setCurrentPrompt(act.config.initial_prompt)
      }
    }
    if (partsResult.data) setParticipants(partsResult.data)
    if (respsResult.data) setResponses(respsResult.data)
  }, [id, user, navigate])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  // Navigate to results once session completes (avoids calling navigate() during render)
  useEffect(() => {
    if (session?.status === 'completed' && session.id) {
      navigate(`/instructor/results/${session.id}`)
    }
  }, [session?.status, session?.id, navigate])

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
    if (!session || !activity) return
    if (activity.config.auto_advance) {
      // Auto-advance: go straight to the next round (or end session)
      await advanceRound()
    } else {
      await supabase
        .from('sessions')
        .update({ status: 'between_rounds' })
        .eq('id', session.id)
      setSession((prev) => prev ? { ...prev, status: 'between_rounds' } : null)
    }
  }

  async function startSession(customPrompt?: string) {
    if (advancingRef.current || !session || !activity) return
    advancingRef.current = true
    setAdvancing(true)
    try {
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
    } finally {
      advancingRef.current = false
      setAdvancing(false)
    }
  }

  async function advanceRound() {
    if (advancingRef.current || !session || !activity) return
    setPeerWarning(null)
    advancingRef.current = true
    setAdvancing(true)
    try {
      const nextRound = session.current_round + 1
      if (nextRound > activity.config.rounds) {
        await doEndSession()
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
          const prompt = activity.config.critique_prompt ?? DEFAULT_CRITIQUE_PROMPT
          setCurrentPrompt(prompt)
          await broadcastEvent('round:start', { round: nextRound, duration_sec: activity.config.round_duration_sec, prompt, server_timestamp: now })
          const ok = await assignPeers(currentResponses, session.current_round)
          if (!ok) setPeerWarning('Peer assignment skipped — fewer than 2 students submitted. Students will see a waiting screen.')
        } else if (nextRound === 3) {
          const prompt = activity.config.rebuttal_prompt ?? DEFAULT_REBUTTAL_PROMPT
          setCurrentPrompt(prompt)
          await broadcastEvent('round:start', { round: nextRound, duration_sec: activity.config.round_duration_sec, prompt, server_timestamp: now })
          await assignRebuttals(currentResponses, session.current_round)
        } else {
          const prompt = 'Continue developing your argument based on the discussion so far.'
          setCurrentPrompt(prompt)
          await broadcastEvent('round:start', { round: nextRound, duration_sec: activity.config.round_duration_sec, prompt, server_timestamp: now })
        }
      } else if (activity.type === 'peer_clarification') {
        // Round 2: each student receives a peer's confusion to explain
        const prompt = activity.config.explain_prompt ?? DEFAULT_EXPLAIN_PROMPT
        setCurrentPrompt(prompt)
        await broadcastEvent('round:start', { round: nextRound, duration_sec: activity.config.round_duration_sec, prompt, server_timestamp: now })
        const ok = await assignPeers(currentResponses, session.current_round, 'clarification')
        if (!ok) setPeerWarning('Peer assignment skipped — fewer than 2 students submitted.')
      } else if (activity.type === 'evidence_analysis') {
        // Round 2: each student receives a peer's interpretation to critique
        const prompt = activity.config.gap_prompt ?? DEFAULT_GAP_PROMPT
        setCurrentPrompt(prompt)
        await broadcastEvent('round:start', { round: nextRound, duration_sec: activity.config.round_duration_sec, prompt, server_timestamp: now })
        const ok = await assignPeers(currentResponses, session.current_round, 'evidence_gap')
        if (!ok) setPeerWarning('Peer assignment skipped — fewer than 2 students submitted.')
      } else if (activity.type === 'socratic_chain') {
        // Generate all follow-ups first so students don't see a loading delay after round start.
        const promptsByParticipant = await generateFollowUps(currentResponses, session.current_round)
        const prompt = 'Your personalised follow-up question'
        setCurrentPrompt(prompt)
        await broadcastEvent('round:start', { round: nextRound, duration_sec: activity.config.round_duration_sec, prompt, server_timestamp: now })
        await Promise.all(
          currentResponses.map(async (response) => {
            await broadcastEvent('followup:ready', {
              participant_id: response.participant_id,
              prompt: promptsByParticipant.get(response.participant_id) ?? FALLBACK_FOLLOW_UP_PROMPT,
            })
          })
        )
      }
    } finally {
      advancingRef.current = false
      setAdvancing(false)
    }
  }

  async function assignPeers(currentResponses: KilnResponse[], fromRound: number, responseType: 'critique' | 'clarification' | 'evidence_gap' = 'critique'): Promise<boolean> {
    if (!session || currentResponses.length < 2) return false
    const shuffled = shuffleArray(currentResponses)

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
        response_type: responseType,
      })
    }
    return true
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

  async function generateFollowUps(currentResponses: KilnResponse[], fromRound: number): Promise<Map<string, string>> {
    if (!session) return new Map()
    const promptEntries = await Promise.all(
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
          const prompt = data?.prompt ?? FALLBACK_FOLLOW_UP_PROMPT
          return [response.participant_id, prompt] as const
        } catch (err) {
          console.error('Failed to generate follow-up:', err)
          return [response.participant_id, FALLBACK_FOLLOW_UP_PROMPT] as const
        }
      })
    )
    return new Map(promptEntries)
  }

  async function featureResponse(responseId: string, participantName: string, content: string) {
    await broadcastEvent('response:featured', { response_id: responseId, participant_name: participantName, content })
  }

  async function doEndSession() {
    if (!session) return
    await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', session.id)
    await broadcastEvent('session:status', { status: 'completed' })
    navigate(`/instructor/results/${session.id}`)
  }

  async function endSession() {
    if (advancingRef.current || !session) return
    advancingRef.current = true
    setAdvancing(true)
    try {
      await doEndSession()
    } finally {
      advancingRef.current = false
      setAdvancing(false)
    }
  }


  if (authLoading || (!user && !authLoading)) {
    return <div className="flex justify-center py-20 text-slate-500">Loading...</div>
  }

  if (!session || !activity) {
    return <div className="flex justify-center py-20 text-slate-500">Loading session...</div>
  }

  // Scenario activities use a dedicated monitor (no round-advance needed)
  if (activity.type === 'scenario_solo' || activity.type === 'scenario_multi') {
    return (
      <ScenarioMonitor
        sessionId={id!}
        joinCode={session.join_code}
        activity={activity}
        participants={participants}
        sessionStatus={session.status}
        isAdvancing={advancing}
        onStart={() => startSession()}
        onEnd={endSession}
      />
    )
  }

  if (session.status === 'lobby') {
    return (
      <SessionLobby
        joinCode={session.join_code}
        participants={participants}
        isInstructor={true}
        onStart={startSession}
        initialPrompt={activity.config.initial_prompt}
        isStarting={advancing}
        activityTitle={activity.title}
      />
    )
  }

  if (session.status === 'completed') {
    return null  // useEffect handles the navigate
  }

  return (
    <LiveMonitor
      participants={participants}
      responses={responses}
      currentRound={session.current_round}
      roundPrompt={currentPrompt}
      joinCode={session.join_code}
      serverTimestamp={session.round_started_at}
      durationSec={activity.config.round_duration_sec}
      onAdvanceRound={advanceRound}
      onEndSession={endSession}
      onRoundExpire={handleRoundExpire}
      sessionStatus={session.status}
    isAdvancing={advancing}
      peerWarning={peerWarning}
      onDismissPeerWarning={() => setPeerWarning(null)}
      sessionId={id}
      onFeatureResponse={featureResponse}
    />
  )
}
