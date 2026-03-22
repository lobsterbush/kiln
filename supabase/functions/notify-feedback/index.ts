// Kiln: Feedback Notification
// Supabase Edge Function triggered by a Database Webhook on feedback INSERT.
// Sends an email to the admin via Resend API.

const ADMIN_EMAIL = 'charles.crabtree@monash.edu'
const FROM_EMAIL = 'Kiln Feedback <feedback@usekiln.org>'

Deno.serve(async (req) => {
  // Database webhooks send POST with the inserted row
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = await req.json()
    // Supabase webhook payload shape: { type, table, record, ... }
    const record = payload.record ?? payload
    const { category, message, email, created_at } = record

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      console.error('RESEND_API_KEY not set')
      return new Response(JSON.stringify({ error: 'Email not configured' }), { status: 500 })
    }

    const subject = `[Kiln Feedback] ${category ?? 'general'} — ${(message ?? '').slice(0, 60)}`
    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 560px;">
        <h2 style="color: #1e293b; margin-bottom: 4px;">New feedback submitted</h2>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 0;">${new Date(created_at).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 12px; background: #f8fafc; font-size: 13px; color: #64748b; font-weight: 600; width: 100px;">Category</td>
            <td style="padding: 8px 12px; background: #f8fafc; font-size: 14px; color: #1e293b;">${category ?? 'general'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-size: 13px; color: #64748b; font-weight: 600;">Email</td>
            <td style="padding: 8px 12px; font-size: 14px; color: #1e293b;">${email ?? '<em>not provided</em>'}</td>
          </tr>
        </table>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 8px;">
          <p style="margin: 0; font-size: 14px; color: #334155; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message ?? '')}</p>
        </div>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject,
        html,
        ...(email ? { reply_to: email } : {}),
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Resend error:', errBody)
      return new Response(JSON.stringify({ error: 'Email send failed' }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('notify-feedback error:', (err as Error).message)
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 })
  }
})

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
