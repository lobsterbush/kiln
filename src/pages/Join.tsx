import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { JoinSession } from '../components/student/JoinSession'
import { supabase } from '../lib/supabase'
import { generateToken, saveStudentToken } from '../lib/utils'

export function Join() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  async function handleJoin(code: string, name: string) {
    setError(null)

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

    // Duplicate name check (case-insensitive)
    const { data: existingParticipants } = await supabase
      .from('participants')
      .select('display_name')
      .eq('session_id', session.id)
    const nameTaken = existingParticipants?.some(
      (p) => p.display_name.toLowerCase() === name.trim().toLowerCase()
    )
    if (nameTaken) {
      setError(`"${name.trim()}" is already taken in this session. Please use a different name.`)
      return
    }

    // Create participant
    const token = generateToken()
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({
        session_id: session.id,
        display_name: name,
        token,
      })
      .select()
      .single()

    if (participantError || !participant) {
      setError('Could not join session. Try again.')
      return
    }

    // Save token locally
    saveStudentToken({
      participant_id: participant.id,
      token,
      session_id: session.id,
      display_name: name,
    })

    // Non-blocking broadcast: wait for SUBSCRIBED before sending to avoid race condition
    const bc = supabase.channel(`session:${session.id}`)
    bc.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        bc.send({
          type: 'broadcast',
          event: 'participant:joined',
          payload: { participant_id: participant.id, display_name: name },
        }).then(() => supabase.removeChannel(bc))
      }
    })

    navigate(`/session/${session.id}`)
  }

  return (
    <JoinSession
      onJoin={handleJoin}
      error={error}
      initialCode={searchParams.get('code') ?? ''}
    />
  )
}
