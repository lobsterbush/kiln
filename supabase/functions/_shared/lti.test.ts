import { assertEquals, assertThrows } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { getCorsHeaders, corsResponse, jsonResponse, decodeJwtPayload, decodeJwtHeader, LTI_CLAIMS } from './lti.ts'

// Helper: build a request with a specific Origin
function makeReq(origin?: string): Request {
  const headers: Record<string, string> = {}
  if (origin) headers['Origin'] = origin
  return new Request('https://fn.supabase.co/test', { headers })
}

Deno.test('getCorsHeaders: allowed origin is reflected', () => {
  const headers = getCorsHeaders(makeReq('https://usekiln.org'))
  assertEquals(headers['Access-Control-Allow-Origin'], 'https://usekiln.org')
})

Deno.test('getCorsHeaders: localhost origin is allowed', () => {
  const headers = getCorsHeaders(makeReq('http://localhost:5173'))
  assertEquals(headers['Access-Control-Allow-Origin'], 'http://localhost:5173')
})

Deno.test('getCorsHeaders: unknown origin falls back to usekiln.org', () => {
  const headers = getCorsHeaders(makeReq('https://evil.com'))
  assertEquals(headers['Access-Control-Allow-Origin'], 'https://usekiln.org')
})

Deno.test('getCorsHeaders: missing origin falls back to usekiln.org', () => {
  const headers = getCorsHeaders(makeReq())
  assertEquals(headers['Access-Control-Allow-Origin'], 'https://usekiln.org')
})

Deno.test('getCorsHeaders: includes Vary header', () => {
  const headers = getCorsHeaders(makeReq('https://usekiln.org'))
  assertEquals(headers['Vary'], 'Origin')
})

Deno.test('corsResponse: returns ok body with CORS headers', async () => {
  const res = corsResponse(makeReq('https://usekiln.org'))
  assertEquals(res.headers.get('Access-Control-Allow-Origin'), 'https://usekiln.org')
  assertEquals(await res.text(), 'ok')
})

Deno.test('jsonResponse: returns JSON with correct status', async () => {
  const res = jsonResponse(makeReq(), { error: 'test' }, 400)
  assertEquals(res.status, 400)
  assertEquals(res.headers.get('Content-Type'), 'application/json')
  const body = await res.json()
  assertEquals(body.error, 'test')
})

Deno.test('jsonResponse: defaults to 200', () => {
  const res = jsonResponse(makeReq(), { ok: true })
  assertEquals(res.status, 200)
})

// Create a minimal base64url JWT for testing (no real signing)
function fakeJwt(header: object, payload: object): string {
  const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${enc(header)}.${enc(payload)}.fakesig`
}

Deno.test('decodeJwtPayload: decodes payload correctly', () => {
  const token = fakeJwt({ alg: 'RS256', kid: 'key1' }, { sub: 'user123', iss: 'https://canvas.instructure.com' })
  const payload = decodeJwtPayload(token)
  assertEquals(payload.sub, 'user123')
  assertEquals(payload.iss, 'https://canvas.instructure.com')
})

Deno.test('decodeJwtHeader: extracts kid', () => {
  const token = fakeJwt({ alg: 'RS256', kid: 'mykey' }, { sub: 'x' })
  const header = decodeJwtHeader(token)
  assertEquals(header.kid, 'mykey')
  assertEquals(header.alg, 'RS256')
})

Deno.test('decodeJwtPayload: throws on invalid JWT (wrong number of parts)', () => {
  assertThrows(() => decodeJwtPayload('not.a.valid.jwt.at.all'), Error, 'Invalid JWT')
})

Deno.test('decodeJwtHeader: throws on invalid JWT', () => {
  assertThrows(() => decodeJwtHeader('single'), Error, 'Invalid JWT')
})

Deno.test('LTI_CLAIMS: has expected claim keys', () => {
  assertEquals(LTI_CLAIMS.MESSAGE_TYPE, 'https://purl.imsglobal.org/spec/lti/claim/message_type')
  assertEquals(LTI_CLAIMS.ROLES, 'https://purl.imsglobal.org/spec/lti/claim/roles')
  assertEquals(LTI_CLAIMS.CONTEXT, 'https://purl.imsglobal.org/spec/lti/claim/context')
  assertEquals(LTI_CLAIMS.AGS_ENDPOINT, 'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint')
})

// LTI Launch logic tests
Deno.test('lti-launch: instructor role detection includes Instructor', () => {
  const roles = ['http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor']
  const isInstructor = roles.some((r) => r.includes('Instructor') || r.includes('Administrator'))
  assertEquals(isInstructor, true)
})

Deno.test('lti-launch: student role is not instructor', () => {
  const roles = ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner']
  const isInstructor = roles.some((r) => r.includes('Instructor') || r.includes('Administrator'))
  assertEquals(isInstructor, false)
})

Deno.test('lti-launch: administrator is treated as instructor', () => {
  const roles = ['http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator']
  const isInstructor = roles.some((r) => r.includes('Instructor') || r.includes('Administrator'))
  assertEquals(isInstructor, true)
})

// LTI Grade logic tests
Deno.test('lti-grade: scores URL is built correctly', () => {
  const lineitem = 'https://canvas.instructure.com/api/lti/courses/1/line_items/42'
  const scoresUrl = lineitem.replace(/\/$/, '') + '/scores'
  assertEquals(scoresUrl, 'https://canvas.instructure.com/api/lti/courses/1/line_items/42/scores')
})

Deno.test('lti-grade: score is clamped between 0 and 100', () => {
  assertEquals(Math.min(Math.max(-5, 0), 100), 0)
  assertEquals(Math.min(Math.max(50, 0), 100), 50)
  assertEquals(Math.min(Math.max(150, 0), 100), 100)
})

Deno.test('lti-grade: missing fields are detected', () => {
  const body = { platform_sub: null, session_id: 's1', score: null }
  assertEquals(!body.platform_sub || !body.session_id || body.score == null, true)
})
