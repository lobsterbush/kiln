// Kiln: Welcome Email Sender
// Sends a welcome email to new instructors with a template link.
// Can be triggered via:
//   1. Supabase Database Webhook on auth.users INSERT
//   2. Manual invocation from the dashboard
//
// Requires RESEND_API_KEY secret in Supabase Edge Function secrets.

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

const WELCOME_HTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; color: #1e293b;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 32px;">🔥</span>
    <h1 style="font-size: 24px; font-weight: 800; margin: 8px 0 4px;">Welcome to Kiln</h1>
    <p style="color: #64748b; font-size: 14px; margin: 0;">AI-native tools for teaching</p>
  </div>

  <p style="font-size: 15px; line-height: 1.7;">You're in. Here's how to run your first activity in under 2 minutes:</p>

  <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="font-size: 14px; font-weight: 600; color: #c2410c; margin: 0 0 8px;">Step 1: Pick a template</p>
    <p style="font-size: 13px; color: #9a3412; margin: 0 0 12px;">We have 20+ ready-to-use activities across political science, law, philosophy, business, medicine, and more. Each one is fully configured — just click and go.</p>
    <a href="https://usekiln.org/instructor/templates" style="display: inline-block; background: #f97316; color: white; font-weight: 600; font-size: 14px; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Browse Templates →</a>
  </div>

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="font-size: 14px; font-weight: 600; color: #334155; margin: 0 0 8px;">Step 2: Start a session</p>
    <p style="font-size: 13px; color: #64748b; margin: 0;">Click "Start" on any activity. Share the 6-character code with your students. They join on any device — no account needed.</p>
  </div>

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="font-size: 14px; font-weight: 600; color: #334155; margin: 0 0 8px;">Step 3: Watch it happen</p>
    <p style="font-size: 13px; color: #64748b; margin: 0;">Responses appear in real time. When the session ends, export CSV, generate AI feedback, or run an AI debrief.</p>
  </div>

  <p style="font-size: 14px; color: #64748b; line-height: 1.7; margin-top: 24px;">
    Everything is free during beta. If you have feedback, questions, or ideas — reply to this email or reach us at
    <a href="mailto:feedback@usekiln.org" style="color: #f97316; text-decoration: none; font-weight: 500;">feedback@usekiln.org</a>.
  </p>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;">
  <p style="font-size: 11px; color: #94a3b8; text-align: center;">
    Kiln · AI-native active learning · <a href="https://usekiln.org" style="color: #94a3b8;">usekiln.org</a>
  </p>
</body>
</html>
`

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // Support both direct invocation { email } and DB webhook { record: { email } }
    const email: string = body.email ?? body.record?.email ?? ''
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Kiln <welcome@usekiln.org>',
        to: [email],
        subject: 'Welcome to Kiln — your first activity in 2 minutes',
        html: WELCOME_HTML,
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return new Response(JSON.stringify({ error: 'Failed to send email', details: errData }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    return new Response(JSON.stringify({ ok: true, id: data.id }), {
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
