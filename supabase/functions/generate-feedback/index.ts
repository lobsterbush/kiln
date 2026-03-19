// Kiln: Per-Student Formative Feedback Generator
// Supabase Edge Function that reads each student's full response chain
// for a session and generates 2–3 sentences of personalised formative feedback.

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

const TYPE_LABELS: Record<string, string> = {
  initial: 'Initial response',
  critique: 'Peer critique',
  rebuttal: 'Rebuttal',
  followup_answer: 'Follow-up answer',
  clarification: 'Clarification',
  evidence_gap: 'Gap analysis',
}

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

    const jwt = authHeader.slice(7)
    const { data: { user } } = await supabase.auth.getUser(jwt)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify ownership
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
    const initialPrompt: string = config.initial_prompt ?? ''
    const actTitle: string = activity?.title ?? 'Untitled'
    const learningObjectives: string[] = Array.isArray(config.learning_objectives)
      ? config.learning_objectives.filter((s: string) => s.trim())
      : []

    // Load all responses and participants
    const [responsesResult, participantsResult] = await Promise.all([
      supabase
        .from('responses')
        .select('participant_id, round, content, response_type')
        .eq('session_id', session_id)
        .order('round', { ascending: true }),
      supabase
        .from('participants')
        .select('id, display_name')
        .eq('session_id', session_id),
    ])

    const responses = responsesResult.data ?? []
    const participants = participantsResult.data ?? []

    if (responses.length === 0) {
      return new Response(JSON.stringify({ error: 'No responses to evaluate' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Group responses by participant
    const byParticipant = new Map<string, { name: string; responses: typeof responses }>()
    for (const p of participants) {
      byParticipant.set(p.id, { name: p.display_name, responses: [] })
    }
    for (const r of responses) {
      byParticipant.get(r.participant_id)?.responses.push(r)
    }

    // Generate feedback for each participant in parallel (capped at 20 concurrent)
    const participantList = Array.from(byParticipant.entries())
      .filter(([, v]) => v.responses.length > 0)

    const systemPrompt = `You are a thoughtful teaching assistant providing brief, honest formative feedback to university students. Write 2–3 sentences per student. Be specific — reference what they actually wrote. Identify one strength and one area for growth. Be direct without being harsh. Do not use generic phrases like "great job" or "good effort". Return ONLY valid JSON with no markdown or preamble.`

    const feedbackResults = await Promise.all(
      participantList.map(async ([participantId, { name, responses: pResponses }]) => {
        const chain = pResponses
          .map((r) => `[${TYPE_LABELS[r.response_type] ?? r.response_type}, Round ${r.round}]: ${r.content}`)
          .join('\n\n')

        const objectivesSection = learningObjectives.length > 0
          ? `\nLearning objectives:\n${learningObjectives.map((o) => `- ${o}`).join('\n')}`
          : ''

        const userMessage = `Activity: "${actTitle}"
Opening question: "${initialPrompt}"${objectivesSection}

Student: ${name}
Response chain:
${chain}

Return this exact JSON (no other text):
{"participant_id": "${participantId}", "name": "${name}", "text": "2-3 sentence feedback"}`

        try {
          const data = await callClaude(anthropicKey, {
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 300,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
          })
          const raw: string = data.content?.[0]?.text ?? '{}'
          try {
            return JSON.parse(raw)
          } catch {
            const match = raw.match(/\{[\s\S]*\}/)
            return match ? JSON.parse(match[0]) : { participant_id: participantId, name, text: raw.slice(0, 300) }
          }
        } catch {
          return { participant_id: participantId, name, text: 'Could not generate feedback for this student.' }
        }
      })
    )

    // Persist each student's feedback to participants.ai_feedback so they
    // can access it from the student-facing /session/:id/summary page.
    await Promise.all(
      feedbackResults
        .filter((f: { participant_id?: string; text?: string }) => f?.participant_id && f?.text)
        .map((f: { participant_id: string; text: string }) =>
          supabase
            .from('participants')
            .update({ ai_feedback: f.text })
            .eq('id', f.participant_id)
        )
    )

    return new Response(JSON.stringify({ feedback: feedbackResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
