/**
 * Shared LTI 1.3 helpers for Kiln edge functions.
 * Handles CORS, JWT decoding, and JWKS key import.
 */

// --- CORS ---

const ALLOWED_ORIGINS = [
  'https://usekiln.org',
  'https://www.usekiln.org',
  'https://lobsterbush.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
]

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  }
}

export function corsResponse(req: Request): Response {
  return new Response('ok', { headers: getCorsHeaders(req) })
}

export function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  })
}

// --- JWT helpers (no external deps) ---

/** Base64url-decode a string to Uint8Array. */
function base64urlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Decode a JWT payload without verifying the signature (verification is separate). */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT')
  const payload = new TextDecoder().decode(base64urlDecode(parts[1]))
  return JSON.parse(payload)
}

/** Decode the JWT header to extract `kid`. */
export function decodeJwtHeader(token: string): { kid?: string; alg?: string } {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT')
  const header = new TextDecoder().decode(base64urlDecode(parts[0]))
  return JSON.parse(header)
}

/** Fetch a JWKS from a URL and return the matching CryptoKey for RS256 verification. */
export async function fetchJwk(jwksUrl: string, kid: string): Promise<CryptoKey> {
  const res = await fetch(jwksUrl)
  if (!res.ok) throw new Error(`Failed to fetch JWKS from ${jwksUrl}`)
  const jwks = (await res.json()) as { keys: JsonWebKey[] }
  const key = jwks.keys.find((k: Record<string, unknown>) => k.kid === kid)
  if (!key) throw new Error(`Key ${kid} not found in JWKS`)

  return crypto.subtle.importKey(
    'jwk',
    key,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
}

/** Verify a JWT signature using RS256. Returns the decoded payload. */
export async function verifyJwt(
  token: string,
  jwksUrl: string,
): Promise<Record<string, unknown>> {
  const header = decodeJwtHeader(token)
  if (!header.kid) throw new Error('JWT missing kid header')

  const key = await fetchJwk(jwksUrl, header.kid)
  const parts = token.split('.')
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  const signature = base64urlDecode(parts[2])

  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data)
  if (!valid) throw new Error('JWT signature verification failed')

  const payload = decodeJwtPayload(token)

  // Check expiration
  const now = Math.floor(Date.now() / 1000)
  if (typeof payload.exp === 'number' && payload.exp < now) {
    throw new Error('JWT expired')
  }

  return payload
}

// --- LTI Claim constants ---

export const LTI_CLAIMS = {
  MESSAGE_TYPE: 'https://purl.imsglobal.org/spec/lti/claim/message_type',
  VERSION: 'https://purl.imsglobal.org/spec/lti/claim/version',
  DEPLOYMENT_ID: 'https://purl.imsglobal.org/spec/lti/claim/deployment_id',
  TARGET_LINK_URI: 'https://purl.imsglobal.org/spec/lti/claim/target_link_uri',
  ROLES: 'https://purl.imsglobal.org/spec/lti/claim/roles',
  CONTEXT: 'https://purl.imsglobal.org/spec/lti/claim/context',
  RESOURCE_LINK: 'https://purl.imsglobal.org/spec/lti/claim/resource_link',
  AGS_ENDPOINT: 'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint',
} as const
