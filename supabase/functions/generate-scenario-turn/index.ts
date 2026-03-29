// Kiln: Scenario Turn Generator
// Validates the student's token, persists their message, calls Claude as
// the configured AI persona(s), persists the AI reply, and returns the
// updated transcript plus a `completed` flag when max_turns is reached.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callClaude } from '../_shared/anthropic.ts'

const ALLOWED_ORIGINS = [
  'https://usekiln.org',
  'https://www.usekiln.org',
  'https://lobsterbush.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
]

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { session_id, participant_id, token, content } = await req.json()
    if (!session_id || !participant_id || !token || !content?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Validate token
    const { data: participant } = await supabase
      .from('participants')
      .select('id, display_name, session_id')
      .eq('id', participant_id)
      .eq('token', token)
      .eq('session_id', session_id)
      .single()

    if (!participant) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Load session + activity config
    const { data: session } = await supabase
      .from('sessions')
      .select('status, activity:activities(title, type, config)')
      .eq('id', session_id)
      .single()

    if (!session || session.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Session not active' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activity = session.activity as any
    const config = activity?.config ?? {}
    const maxTurns: number = config.max_turns ?? 8
    const activityType: string = activity?.type ?? 'scenario_solo'
    const scenarioContext: string = config.scenario_context ?? ''
    const studentRole: string = config.student_role ?? 'Student'
    const personas: Array<{ name: string; role: string; goals: string; personality?: string }> =
      config.ai_personas ?? []

    // Load existing transcript for this participant
    const { data: existingMessages } = await supabase
      .from('scenario_messages')
      .select('turn, speaker_type, speaker_name, content')
      .eq('session_id', session_id)
      .eq('participant_id', participant_id)
      .order('turn', { ascending: true })

    const transcript = existingMessages ?? []

    // Each student message + AI reply = 1 "turn"; student turns are odd (1,3,5…)
    const studentTurnCount = transcript.filter((m: { speaker_type: string }) => m.speaker_type === 'student').length
    if (studentTurnCount >= maxTurns) {
      return new Response(JSON.stringify({ error: 'Max turns reached', completed: true }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const nextTurn = transcript.length + 1

    // Persist student message
    await supabase.from('scenario_messages').insert({
      session_id,
      participant_id,
      turn: nextTurn,
      speaker_type: 'student',
      speaker_name: participant.display_name,
      content: content.trim(),
    })

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build Claude system prompt based on type
    let systemPrompt = ''
    let respondingPersonaName = ''

    if (activityType === 'scenario_solo') {
      const persona = personas[0] ?? { name: 'Counterpart', role: 'Negotiating counterpart', goals: 'Advance your interests strategically' }
      respondingPersonaName = persona.name
      systemPrompt = `You are ${persona.name}, ${persona.role}.
Your goals: ${persona.goals}.${persona.personality ? `\nPersonality: ${persona.personality}` : ''}

SCENARIO CONTEXT:
${scenarioContext}

The student is playing the role of: ${studentRole}

You are engaged in a real-time simulation. Stay fully in character as ${persona.name} at all times. Do NOT break character, offer meta-commentary, or mention that you are an AI. Respond naturally to what the student says. Be substantive, strategically realistic, and appropriately challenging — push back, make demands, hold positions, but remain responsive to good arguments. Keep your responses to 2–4 sentences unless the student's message warrants a longer reply.`
    } else {
      // scenario_multi: orchestrator selects which persona responds
      const personaDescriptions = personas.map((p, i) =>
        `${i + 1}. ${p.name} — ${p.role}. Goals: ${p.goals}.${p.personality ? ` Personality: ${p.personality}` : ''}`
      ).join('\n')

      // Build prior turn context to decide who responds
      const recentTurns = [...transcript.slice(-6), { speaker_type: 'student', speaker_name: participant.display_name, content: content.trim() }]
      const turnSummary = recentTurns.map((m: { speaker_name: string; content: string }) => `${m.speaker_name}: ${m.content}`).join('\n')

      // First ask Claude which persona should respond
      const orchData = await callClaude(anthropicKey, {
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 20,
        system: `You are an orchestrator for a multi-stakeholder simulation. Given the conversation and the stakeholders, decide which ONE stakeholder should respond to the student's latest message. Reply with only the name of that stakeholder, nothing else.`,
        messages: [{
          role: 'user',
          content: `Stakeholders:\n${personaDescriptions}\n\nRecent conversation:\n${turnSummary}\n\nWhich stakeholder responds next? (name only)`,
        }],
      })
      const chosenName = orchData.content?.[0]?.text?.trim() ?? personas[0]?.name ?? 'Counterpart'
      const chosenPersona = personas.find((p) => p.name.toLowerCase() === chosenName.toLowerCase()) ?? personas[0]
      respondingPersonaName = chosenPersona?.name ?? chosenName

      systemPrompt = `You are ${chosenPersona?.name ?? chosenName}, ${chosenPersona?.role ?? 'a stakeholder'}.
Your goals: ${chosenPersona?.goals ?? ''}.${chosenPersona?.personality ? `\nPersonality: ${chosenPersona.personality}` : ''}

SCENARIO CONTEXT:
${scenarioContext}

Other stakeholders in this simulation: ${personas.filter((p) => p.name !== respondingPersonaName).map((p) => p.name).join(', ')}

The student is playing the role of: ${studentRole}

Stay fully in character as ${respondingPersonaName}. Do NOT break character or mention AI. Respond naturally and strategically. Keep your response to 2–4 sentences.`
    }

    // Build conversation history for Claude
    const historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const msg of transcript) {
      if (msg.speaker_type === 'student') {
        historyMessages.push({ role: 'user', content: msg.content })
      } else {
        historyMessages.push({ role: 'assistant', content: msg.content })
      }
    }
    // Add current student message
    historyMessages.push({ role: 'user', content: content.trim() })

    // Generate AI response
    const aiData = await callClaude(anthropicKey, {
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: systemPrompt,
      messages: historyMessages,
    })
    const aiContent: string = aiData.content?.[0]?.text ?? '...'

    // Persist AI reply
    const aiTurn = nextTurn + 1
    await supabase.from('scenario_messages').insert({
      session_id,
      participant_id,
      turn: aiTurn,
      speaker_type: 'ai',
      speaker_name: respondingPersonaName,
      content: aiContent,
    })

    const newStudentTurnCount = studentTurnCount + 1
    const completed = newStudentTurnCount >= maxTurns

    return new Response(JSON.stringify({
      speaker_name: respondingPersonaName,
      content: aiContent,
      turn: aiTurn,
      student_turns_used: newStudentTurnCount,
      max_turns: maxTurns,
      completed,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
