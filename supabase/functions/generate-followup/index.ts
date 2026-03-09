// Kiln: Socratic Chain Follow-Up Generator
// Supabase Edge Function that calls Claude API to generate
// personalized follow-up questions based on student responses.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { response_id, session_id, participant_id, round } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch the student's response
    const { data: response } = await supabase
      .from('responses')
      .select('content')
      .eq('id', response_id)
      .single()

    if (!response) {
      return new Response(JSON.stringify({ error: 'Response not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch activity config (learning objectives)
    const { data: session } = await supabase
      .from('sessions')
      .select('activity:activities(config)')
      .eq('id', session_id)
      .single()

    const config = (session?.activity as any)?.config ?? {}
    const objectives = config.learning_objectives?.join('; ') ?? ''

    // Call Claude API
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: `You are a Socratic tutor. You never provide information or answers. You only ask ONE targeted follow-up question that probes the weakest part of the student's reasoning. Be specific to what the student actually wrote. Do not be generic. Do not praise the student. Just ask the question.${objectives ? `\n\nLearning objectives: ${objectives}` : ''}`,
        messages: [
          {
            role: 'user',
            content: `Student's response (Round ${round}):\n\n${response.content}`,
          },
        ],
      }),
    })

    const claudeData = await claudeResponse.json()
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
