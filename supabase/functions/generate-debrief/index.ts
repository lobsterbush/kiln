// Kiln: AI Session Debrief Generator
// Supabase Edge Function that analyses all session responses and returns
// a structured teaching debrief: themes, gaps, notable quotes, suggestion.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  peer_critique: 'Peer Critique',
  socratic_chain: 'Socratic Chain',
  peer_clarification: 'Peer Clarification',
  evidence_analysis: 'Evidence Analysis',
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authenticated instructor
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

    // Verify JWT belongs to a real user
    const jwt = authHeader.slice(7)
    const { data: { user } } = await supabase.auth.getUser(jwt)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify caller owns this session
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

    const activity = session.activity as any
    const config = activity?.config ?? {}
    const actType: string = activity?.type ?? ''
    const actTitle: string = activity?.title ?? 'Untitled'
    const initialPrompt: string = config.initial_prompt ?? ''

    // Load all responses with participant names
    const [responsesResult, participantsResult] = await Promise.all([
      supabase
        .from('responses')
        .select('participant_id, round, content, response_type')
        .eq('session_id', session_id)
        .order('round', { ascending: true })
        .order('submitted_at', { ascending: true }),
      supabase
        .from('participants')
        .select('id, display_name')
        .eq('session_id', session_id),
    ])

    const responses = responsesResult.data ?? []
    const participants = participantsResult.data ?? []

    if (responses.length === 0) {
      return new Response(JSON.stringify({ error: 'No responses to analyse' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build name lookup
    const nameMap = new Map<string, string>()
    for (const p of participants) nameMap.set(p.id, p.display_name)

    // Group responses by round, truncate long responses
    const rounds: Record<number, string[]> = {}
    for (const r of responses) {
      if (!rounds[r.round]) rounds[r.round] = []
      const name = nameMap.get(r.participant_id) ?? 'Student'
      const excerpt = r.content.length > 300 ? r.content.slice(0, 300) + '…' : r.content
      rounds[r.round].push(`${name}: "${excerpt}"`)
    }

    const roundsSummary = Object.entries(rounds)
      .map(([round, lines]) => `ROUND ${round} (${lines.length} responses):\n${lines.join('\n')}`)
      .join('\n\n')

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = `You are a teaching assistant helping a university instructor understand what happened in their active learning session. Be concise and specific — only reference what students actually wrote. Return ONLY valid JSON with no markdown formatting, no code blocks, no preamble.`

    const userMessage = `Activity: "${actTitle}" (${TYPE_LABELS[actType] ?? actType})
Opening question: "${initialPrompt}"
Total participants: ${participants.length}
Total responses: ${responses.length}

${roundsSummary}

Return this exact JSON structure (no other text):
{
  "themes": ["2–3 brief strings describing the main lines of argument or understanding students showed"],
  "gaps": ["1–2 brief strings describing common misconceptions, unsupported leaps, or reasoning gaps"],
  "notable": [
    {"quote": "a brief student excerpt worth discussing in class (under 25 words)", "why": "one sentence explaining why this is worth raising"}
  ],
  "suggestion": "one concrete sentence about what the instructor should address or build on next class"
}`

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    const claudeData = await claudeResponse.json()
    if (!claudeResponse.ok) {
      console.error('Claude API error:', claudeResponse.status, JSON.stringify(claudeData))
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rawText: string = claudeData.content?.[0]?.text ?? '{}'

    // Parse JSON robustly — Claude sometimes adds minor formatting
    let debrief: unknown
    try {
      debrief = JSON.parse(rawText)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          debrief = JSON.parse(match[0])
        } catch {
          debrief = { themes: [], gaps: [], notable: [], suggestion: rawText.slice(0, 200) }
        }
      } else {
        debrief = { themes: [], gaps: [], notable: [], suggestion: 'Could not parse AI response.' }
      }
    }

    return new Response(JSON.stringify(debrief), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
