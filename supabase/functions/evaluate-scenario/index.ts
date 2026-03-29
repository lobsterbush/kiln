// Kiln: Scenario Evaluation Generator
// Instructor-authenticated. Reads all participant transcripts for a session,
// calls Claude with a rubric-based evaluation prompt per participant, and
// upserts results to scenario_evaluations.

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

const DEFAULT_RUBRIC = ['reasoning', 'communication', 'evidence', 'ethics']

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { session_id } = await req.json()
    if (!session_id) {
      return new Response(JSON.stringify({ error: 'Missing session_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify instructor ownership
    const jwt = authHeader.slice(7)
    const { data: { user } } = await supabase.auth.getUser(jwt)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: session } = await supabase
      .from('sessions')
      .select('instructor_id, activity:activities(title, type, config)')
      .eq('id', session_id)
      .single()

    if (!session || session.instructor_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activity = session.activity as any
    const config = activity?.config ?? {}
    const scenarioContext: string = config.scenario_context ?? ''
    const studentRole: string = config.student_role ?? 'Student'
    const rubric: string[] = Array.isArray(config.evaluation_rubric) && config.evaluation_rubric.length > 0
      ? config.evaluation_rubric
      : DEFAULT_RUBRIC
    const actTitle: string = activity?.title ?? 'Scenario'

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Load all scenario messages for the session
    const [messagesResult, participantsResult] = await Promise.all([
      supabase
        .from('scenario_messages')
        .select('participant_id, turn, speaker_type, speaker_name, content')
        .eq('session_id', session_id)
        .order('turn', { ascending: true }),
      supabase
        .from('participants')
        .select('id, display_name')
        .eq('session_id', session_id),
    ])

    const allMessages = messagesResult.data ?? []
    const participants = participantsResult.data ?? []

    if (allMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages to evaluate' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Group messages by participant
    const byParticipant = new Map<string, { name: string; messages: typeof allMessages }>()
    for (const p of participants) {
      byParticipant.set(p.id, { name: p.display_name, messages: [] })
    }
    for (const msg of allMessages) {
      byParticipant.get(msg.participant_id)?.messages.push(msg)
    }

    const rubricKeys = rubric.map((r) => r.toLowerCase().replace(/\s+/g, '_'))
    const rubricJson = rubricKeys.reduce((acc, k) => ({ ...acc, [k]: 'score 1-5' }), {})

    const systemPrompt = `You are an expert evaluator for scenario-based simulations in higher education. You will evaluate a student's performance in a role-play simulation. Score each dimension from 1 to 5 (1=poor, 3=adequate, 5=excellent). Provide 3–4 sentences of specific, actionable written feedback that references what the student actually did. Be direct and honest — identify both strengths and areas for development. Return ONLY valid JSON with no markdown or preamble.`

    const evaluations = await Promise.all(
      Array.from(byParticipant.entries())
        .filter(([, v]) => v.messages.filter((m) => m.speaker_type === 'student').length > 0)
        .map(async ([participantId, { name, messages }]) => {
          const transcript = messages
            .map((m) => `[${m.speaker_name}]: ${m.content}`)
            .join('\n\n')

          const userMessage = `Activity: "${actTitle}"
Scenario: ${scenarioContext}
Student role: ${studentRole}

Student: ${name}
Transcript:
${transcript}

Evaluate this student's performance. Return this exact JSON:
{
  "participant_id": "${participantId}",
  "scores": ${JSON.stringify(rubricJson)},
  "feedback": "3-4 sentence written evaluation"
}`

          try {
            const data = await callClaude(anthropicKey, {
              model: 'claude-sonnet-4-6',
              max_tokens: 500,
              system: systemPrompt,
              messages: [{ role: 'user', content: userMessage }],
            })
            const raw: string = data.content?.[0]?.text ?? '{}'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let parsed: any
            try {
              parsed = JSON.parse(raw)
            } catch {
              const match = raw.match(/\{[\s\S]*\}/)
              parsed = match ? JSON.parse(match[0]) : { participant_id: participantId, scores: {}, feedback: raw.slice(0, 400) }
            }

            // Upsert to DB
            await supabase.from('scenario_evaluations').upsert({
              session_id,
              participant_id: participantId,
              content: { scores: parsed.scores ?? {}, feedback: parsed.feedback ?? '' },
            }, { onConflict: 'session_id,participant_id' })

            return { participant_id: participantId, name, ...parsed }
          } catch {
            return { participant_id: participantId, name, error: 'Evaluation failed' }
          }
        })
    )

    return new Response(JSON.stringify({ evaluations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
