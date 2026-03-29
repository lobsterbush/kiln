// Kiln: Socratic Chain Follow-Up Generator
// Supabase Edge Function that calls Claude API to generate
// personalized follow-up questions based on student responses.

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
    // Verify the caller is an authenticated instructor
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { response_id, session_id, participant_id, round } = await req.json()

    // Validate required fields
    if (!response_id || !session_id || !participant_id || round == null) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify the JWT belongs to a real user
    const jwt = authHeader.slice(7)
    const { data: { user } } = await supabase.auth.getUser(jwt)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the caller owns the session (prevents instructors targeting each other's sessions)
    const { data: sessionOwner } = await supabase
      .from('sessions')
      .select('instructor_id')
      .eq('id', session_id)
      .single()
    if (!sessionOwner || sessionOwner.instructor_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate: verify the response belongs to the claimed session and participant
    const { data: response } = await supabase
      .from('responses')
      .select('content, session_id, participant_id')
      .eq('id', response_id)
      .single()

    if (!response) {
      return new Response(JSON.stringify({ error: 'Response not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (response.session_id !== session_id || response.participant_id !== participant_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch ALL prior responses by this participant (the full Socratic chain)
    const { data: priorResponses } = await supabase
      .from('responses')
      .select('round, content, response_type')
      .eq('session_id', session_id)
      .eq('participant_id', participant_id)
      .order('round', { ascending: true })
    const responseChain = priorResponses ?? []

    // Fetch activity config (learning objectives, source material, prompt)
    const { data: session } = await supabase
      .from('sessions')
      .select('activity:activities(config)')
      .eq('id', session_id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = (session?.activity as any)?.config ?? {}
    const objectives = config.learning_objectives?.join('; ') ?? ''
    const originalPrompt = config.initial_prompt ?? ''
    // Trim source material to avoid excessive token usage
    const rawMaterial: string = config.source_material ?? ''
    const sourceMaterial = rawMaterial.length > 3000 ? rawMaterial.slice(0, 3000) + '…' : rawMaterial

    // Call Claude API
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build the full conversation chain for Claude
    const chainText = responseChain.map((r) => {
      const label = r.response_type === 'initial' ? 'Initial response' :
        r.response_type === 'followup_answer' ? 'Follow-up answer' : r.response_type
      return `[Round ${r.round} — ${label}]\n${r.content}`
    }).join('\n\n')

    const claudeData = await callClaude(anthropicKey, {
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: `You are a Socratic tutor conducting a sustained inquiry with one student. Your job is to ask ONE precise follow-up question that forces the student to confront the weakest point in their reasoning.

Rules:
- Quote or paraphrase a specific claim the student made, then ask why it holds.
- If the student made a causal claim, ask about the mechanism. If they cited evidence, probe its limits. If they offered an analogy, ask where it breaks down.
- Never provide information, answers, or hints. Never praise the student.
- Your question must be impossible to answer with a generic response — it should require the student to think harder about what THEY specifically wrote.
- If this is a later round, notice whether the student actually addressed the gap from their previous answer or just pivoted. Call that out if so.
- Ground your question in the activity’s source material and learning objectives when possible.${originalPrompt ? `\n\nThe original question posed to students:\n${originalPrompt}` : ''}${sourceMaterial ? `\n\nSource material for this activity (use this to anchor your follow-up in the specific content students are engaging with):\n${sourceMaterial}` : ''}${objectives ? `\n\nLearning objectives the instructor wants students to work toward:\n${objectives}` : ''}`,
      messages: [
        {
          role: 'user',
          content: `Here is this student’s full response chain so far:\n\n${chainText}\n\nAsk your follow-up question about their Round ${round} response.`,
        },
      ],
    })
    const followUpPrompt = claudeData.content?.[0]?.text ?? 'Can you elaborate on your reasoning?'

    // Save to database
    await supabase.from('follow_ups').insert({
      session_id,
      participant_id,
      round,
      prompt: followUpPrompt,
      based_on_response_id: response_id,
    })

    return new Response(JSON.stringify({ prompt: followUpPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
