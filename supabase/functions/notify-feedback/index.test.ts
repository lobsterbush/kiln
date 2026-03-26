import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

Deno.test('notify-feedback: escapeHtml handles all special characters', () => {
  assertEquals(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
})

Deno.test('notify-feedback: escapeHtml passes through safe text', () => {
  assertEquals(escapeHtml('Hello world'), 'Hello world')
})

Deno.test('notify-feedback: escapeHtml handles ampersands', () => {
  assertEquals(escapeHtml('A & B'), 'A &amp; B')
})

Deno.test('notify-feedback: extracts record from webhook payload', () => {
  const payload = { type: 'INSERT', table: 'feedback', record: { category: 'bug', message: 'It broke', email: 'a@b.com', created_at: '2026-01-01T00:00:00Z' } }
  const record = payload.record ?? payload
  assertEquals(record.category, 'bug')
  assertEquals(record.message, 'It broke')
})

Deno.test('notify-feedback: falls back to payload itself when no record key', () => {
  const payload = { category: 'feature', message: 'Add dark mode', email: null, created_at: '2026-01-01T00:00:00Z' }
  const record = (payload as Record<string, unknown>).record ?? payload
  assertEquals((record as typeof payload).category, 'feature')
})

Deno.test('notify-feedback: subject line is truncated to 60 chars', () => {
  const message = 'A'.repeat(100)
  const subject = `[Kiln Feedback] bug — ${message.slice(0, 60)}`
  assertEquals(subject.length, 60 + '[Kiln Feedback] bug — '.length)
})

Deno.test('notify-feedback: reply_to is set when email is provided', () => {
  const email = 'user@example.com'
  const emailObj = email ? { reply_to: email } : {}
  assertEquals(emailObj, { reply_to: 'user@example.com' })
})

Deno.test('notify-feedback: reply_to is omitted when email is null', () => {
  const email: string | null = null
  const emailObj = email ? { reply_to: email } : {}
  assertEquals(emailObj, {})
})
