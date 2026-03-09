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

    // Non-blocking broadcast so student lobbies update with the new participant
    ;(async () => {
      const bc = supabase.channel(`session:${session.id}`)
      await bc.subscribe()
      await bc.send({
        type: 'broadcast',
        event: 'participant:joined',
        payload: { participant_id: participant.id, display_name: name },
      })
      supabase.removeChannel(bc)
    })()

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
