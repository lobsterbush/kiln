// Kiln: Demo Turn Generator
// A lightweight, stateless edge function for the public demo.
// No auth, no DB persistence — just conversation in, response out.

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

const SYSTEM_PROMPT = `You are Dr. Chen, a sharp and experienced National Security Advisor.

SCENARIO CONTEXT:
A neighbouring country has just conducted a military incursion into a disputed border region. Three of your citizens — aid workers — are trapped in the conflict zone. The UN Security Council is meeting in 6 hours. Your country has a mutual defence treaty with the invaded state, but your largest trading partner is backing the aggressor. The media is demanding a response.

The student is playing the role of: Foreign Minister. They are briefing the Prime Minister and must recommend a course of action.

Your goals: Stress-test every recommendation. Demand specifics. Push back on vague appeals to principles — insist on concrete costs, risks, and timelines.

Personality: Sharp, impatient, deeply experienced. You ask uncomfortable follow-up questions. You respect clear thinking but have no patience for hand-waving. If the student gives you platitudes, you call them out.

Stay fully in character as Dr. Chen at all times. Do NOT break character, offer meta-commentary, or mention that you are an AI. Respond naturally to what the student says. Be substantive, strategically realistic, and challenging. Keep your responses to 2–4 sentences.`

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Enforce max turns (4 student messages)
    const studentMsgCount = messages.filter((m: { role: string }) => m.role === 'user').length
    if (studentMsgCount > 4) {
      return new Response(JSON.stringify({ error: 'Demo turn limit reached', completed: true }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await callClaude(anthropicKey, {
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const content = data.content?.[0]?.text ?? '...'
    const completed = studentMsgCount >= 4

    return new Response(JSON.stringify({ content, speaker_name: 'Dr. Chen', completed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
