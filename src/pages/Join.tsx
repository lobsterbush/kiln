import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { JoinSession } from '../components/student/JoinSession'
import { supabase } from '../lib/supabase'
import { generateToken, saveStudentToken } from '../lib/utils'
import { TIER_LIMITS, getUserTier } from '../lib/usage-limits'

export function Join() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  async function handleJoin(code: string, name: string) {
    setError(null)

    // Hoisted so the broadcast (outside the try block) can reference them
    let resolvedSessionId = ''
    let resolvedParticipantId = ''
    const resolvedName = name.trim()

    try {
      if (resolvedName.length < 2) {
        setError('Name must be at least 2 characters.')
        return
      }

      // Find session by join code
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, status')
        .eq('join_code', code)
        .single()

      if (sessionError || !session) {
        setError('Session not found. Check the code and try again.')
        return
      }

      if (session.status === 'completed') {
        setError('This session has already ended.')
        return
      }

      // Duplicate name check (case-insensitive) + student cap
      const { data: existingParticipants } = await supabase
        .from('participants')
        .select('display_name')
        .eq('session_id', session.id)

      // Check student-per-session limit
      const limits = TIER_LIMITS[getUserTier()]
      if (existingParticipants && existingParticipants.length >= limits.maxStudentsPerSession) {
        setError(`This session is full (max ${limits.maxStudentsPerSession} students). Please ask your instructor to start a new session.`)
        return
      }

      const nameTaken = existingParticipants?.some(
        (p) => p.display_name.toLowerCase() === resolvedName.toLowerCase()
      )
      if (nameTaken) {
        setError(`"${resolvedName}" is already taken in this session. Please use a different name.`)
        return
      }

      // Create participant
      const token = generateToken()
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert({
          session_id: session.id,
          display_name: resolvedName,
          token,
        })
        .select()
        .single()

      if (participantError || !participant) {
        console.error('[Kiln] Participant insert error:', participantError)
        setError('Could not join session. Try again.')
        return
      }

      // Save token — inner catch gives a specific storage error message
      try {
        saveStudentToken({
          participant_id: participant.id,
          token,
          session_id: session.id,
          display_name: resolvedName,
        })
      } catch (storageErr) {
        console.error('[Kiln] localStorage error:', storageErr)
        const msg = storageErr instanceof Error ? storageErr.message : String(storageErr)
        setError(
          `Could not save your session token (${msg}). ` +
          'Your browser may be blocking storage — try disabling private browsing or allowing cookies for this site.'
        )
        return
      }

      resolvedSessionId = session.id
      resolvedParticipantId = participant.id

      // Navigate before broadcast — broadcast must never block this
      navigate(`/session/${session.id}`)

    } catch (err) {
      // Catches anything unexpected: crypto failure, network throw, etc.
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Kiln] Unexpected join error:', err)
      setError(`Something went wrong (${msg}). Please check your connection and try again.`)
    }

    // Broadcast is completely outside the critical try block —
    // it fires after navigate and never prevents the student from entering the session
    if (resolvedSessionId) {
      try {
        const bc = supabase.channel(`session:${resolvedSessionId}`)
        bc.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            bc.send({
              type: 'broadcast',
              event: 'participant:joined',
              payload: { participant_id: resolvedParticipantId, display_name: resolvedName },
            }).then(() => supabase.removeChannel(bc))
          }
        })
      } catch {
        // Non-critical; instructor sees the participant on page load
      }
    }
  }

  return (
    <JoinSession
      onJoin={handleJoin}
      error={error}
      initialCode={searchParams.get('code') ?? ''}
    />
  )
}
