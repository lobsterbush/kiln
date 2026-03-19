/**
 * Kiln: LTI 1.3 Launch Handler
 *
 * Two-step LTI 1.3 flow:
 *   1. POST /lti-launch?step=login  — OIDC login initiation (platform → Kiln)
 *   2. POST /lti-launch?step=launch — JWT id_token validation + redirect into Kiln
 *
 * Environment variables required:
 *   LTI_PLATFORM_ISSUER     — e.g. "https://canvas.instructure.com"
 *   LTI_PLATFORM_JWKS_URL   — JWKS endpoint for the platform
 *   LTI_CLIENT_ID           — registered client ID
 *   LTI_OIDC_AUTH_URL       — platform's OIDC authorization endpoint
 *   KILN_BASE_URL           — e.g. "https://usekiln.org"
 */

import { corsResponse, jsonResponse, verifyJwt, LTI_CLAIMS } from '../_shared/lti.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse(req)

  const url = new URL(req.url)
  const step = url.searchParams.get('step')

  try {
    if (step === 'login') return handleLogin(req)
    if (step === 'launch') return await handleLaunch(req)
    return jsonResponse(req, { error: 'Missing ?step=login|launch' }, 400)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonResponse(req, { error: message }, 500)
  }
})

// ------------------------------------------------------------------
// Step 1: OIDC Login Initiation
// Platform sends: iss, login_hint, target_link_uri, lti_message_hint
// We redirect back to the platform's auth endpoint.
// ------------------------------------------------------------------

function handleLogin(req: Request): Response {
  const params = new URL(req.url).searchParams
  const iss = params.get('iss')
  const loginHint = params.get('login_hint')
  const targetLinkUri = params.get('target_link_uri')
  const ltiMessageHint = params.get('lti_message_hint')

  if (!iss || !loginHint) {
    return jsonResponse(req, { error: 'Missing iss or login_hint' }, 400)
  }

  const clientId = Deno.env.get('LTI_CLIENT_ID')
  const authUrl = Deno.env.get('LTI_OIDC_AUTH_URL')
  const kilnBase = Deno.env.get('KILN_BASE_URL') ?? 'https://usekiln.org'

  if (!clientId || !authUrl) {
    return jsonResponse(req, { error: 'LTI not configured' }, 500)
  }

  // Generate a nonce and state for CSRF / replay protection
  const nonce = crypto.randomUUID()
  const state = crypto.randomUUID()

  const redirectUri = `${kilnBase}/functions/v1/lti-launch?step=launch`

  const authParams = new URLSearchParams({
    scope: 'openid',
    response_type: 'id_token',
    response_mode: 'form_post',
    client_id: clientId,
    redirect_uri: redirectUri,
    login_hint: loginHint,
    nonce,
    state,
    prompt: 'none',
  })
  if (targetLinkUri) authParams.set('target_link_uri', targetLinkUri)
  if (ltiMessageHint) authParams.set('lti_message_hint', ltiMessageHint)

  return new Response(null, {
    status: 302,
    headers: { Location: `${authUrl}?${authParams.toString()}` },
  })
}

// ------------------------------------------------------------------
// Step 2: Launch — validate JWT and redirect into the app
// ------------------------------------------------------------------

async function handleLaunch(req: Request): Promise<Response> {
  const formData = await req.formData()
  const idToken = formData.get('id_token')

  if (!idToken || typeof idToken !== 'string') {
    return jsonResponse(req, { error: 'Missing id_token' }, 400)
  }

  const jwksUrl = Deno.env.get('LTI_PLATFORM_JWKS_URL')
  const expectedIssuer = Deno.env.get('LTI_PLATFORM_ISSUER')
  const expectedClientId = Deno.env.get('LTI_CLIENT_ID')
  const kilnBase = Deno.env.get('KILN_BASE_URL') ?? 'https://usekiln.org'

  if (!jwksUrl || !expectedIssuer || !expectedClientId) {
    return jsonResponse(req, { error: 'LTI not configured' }, 500)
  }

  // Verify the JWT signature against the platform's JWKS
  const claims = await verifyJwt(idToken, jwksUrl)

  // Validate standard claims
  if (claims.iss !== expectedIssuer) throw new Error('Invalid issuer')
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  if (!aud.includes(expectedClientId)) throw new Error('Invalid audience')

  // Extract LTI-specific claims
  const messageType = claims[LTI_CLAIMS.MESSAGE_TYPE] as string | undefined
  if (messageType !== 'LtiResourceLinkRequest') {
    return jsonResponse(req, { error: `Unsupported message type: ${messageType}` }, 400)
  }

  const roles = (claims[LTI_CLAIMS.ROLES] as string[] | undefined) ?? []
  const context = claims[LTI_CLAIMS.CONTEXT] as { id?: string; label?: string; title?: string } | undefined
  const resourceLink = claims[LTI_CLAIMS.RESOURCE_LINK] as { id?: string; title?: string } | undefined
  const agsEndpoint = claims[LTI_CLAIMS.AGS_ENDPOINT] as { lineitem?: string; lineitems?: string; scope?: string[] } | undefined

  const isInstructor = roles.some((r) =>
    r.includes('Instructor') || r.includes('Administrator') || r.includes('ContentDeveloper'),
  )

  const email = claims.email as string | undefined
  const name = claims.name as string | undefined
  const sub = claims.sub as string

  // Store LTI context in Supabase for grade passback later
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  await supabase.from('lti_launches').upsert({
    platform_sub: sub,
    issuer: expectedIssuer,
    client_id: expectedClientId,
    email,
    name,
    roles,
    context_id: context?.id,
    context_label: context?.label,
    resource_link_id: resourceLink?.id,
    ags_lineitem: agsEndpoint?.lineitem,
    ags_lineitems: agsEndpoint?.lineitems,
    launched_at: new Date().toISOString(),
  }, { onConflict: 'platform_sub,issuer' })

  // Redirect into the Kiln app
  const targetPath = isInstructor ? '/instructor' : '/join'
  const redirectParams = new URLSearchParams({ lti: '1', name: name ?? '', sub })
  if (context?.label) redirectParams.set('course', context.label)

  return new Response(null, {
    status: 302,
    headers: { Location: `${kilnBase}${targetPath}?${redirectParams.toString()}` },
  })
}
