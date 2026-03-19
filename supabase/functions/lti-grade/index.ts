/**
 * Kiln: LTI 1.3 Grade Passback (Assignment and Grade Services)
 *
 * POST body: { platform_sub, session_id, score, comment? }
 *
 * Retrieves the stored AGS lineitem URL from lti_launches, fetches an
 * OAuth2 client_credentials token from the platform, and posts the score.
 *
 * Environment variables required:
 *   LTI_PLATFORM_TOKEN_URL  — platform's OAuth2 token endpoint
 *   LTI_CLIENT_ID           — registered client ID
 *   LTI_CLIENT_SECRET       — client secret for client_credentials grant
 */

import { corsResponse, jsonResponse } from '../_shared/lti.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse(req)

  try {
    const { platform_sub, session_id, score, comment } = await req.json()

    if (!platform_sub || !session_id || score == null) {
      return jsonResponse(req, { error: 'Missing platform_sub, session_id, or score' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Look up the LTI launch context
    const { data: launch, error: launchErr } = await supabase
      .from('lti_launches')
      .select('ags_lineitem, issuer')
      .eq('platform_sub', platform_sub)
      .single()

    if (launchErr || !launch?.ags_lineitem) {
      return jsonResponse(req, { error: 'No AGS lineitem found for this user' }, 404)
    }

    // Get an OAuth2 access token from the platform
    const tokenUrl = Deno.env.get('LTI_PLATFORM_TOKEN_URL')
    const clientId = Deno.env.get('LTI_CLIENT_ID')
    const clientSecret = Deno.env.get('LTI_CLIENT_SECRET')

    if (!tokenUrl || !clientId || !clientSecret) {
      return jsonResponse(req, { error: 'LTI grade passback not configured' }, 500)
    }

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://purl.imsglobal.org/spec/lti-ags/scope/score https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
      }),
    })

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text()
      return jsonResponse(req, { error: `Token request failed: ${errBody}` }, 502)
    }

    const { access_token } = (await tokenRes.json()) as { access_token: string }

    // Post the score to the AGS scores endpoint
    const scoresUrl = launch.ags_lineitem.replace(/\/$/, '') + '/scores'
    const scorePayload = {
      userId: platform_sub,
      scoreGiven: Math.min(Math.max(score, 0), 100),
      scoreMaximum: 100,
      activityProgress: 'Completed',
      gradingProgress: 'FullyGraded',
      timestamp: new Date().toISOString(),
      comment: comment ?? `Kiln session ${session_id}`,
    }

    const scoreRes = await fetch(scoresUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/vnd.ims.lis.v1.score+json',
      },
      body: JSON.stringify(scorePayload),
    })

    if (!scoreRes.ok) {
      const errBody = await scoreRes.text()
      return jsonResponse(req, { error: `Score post failed: ${errBody}` }, 502)
    }

    return jsonResponse(req, { success: true, scoreGiven: scorePayload.scoreGiven })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonResponse(req, { error: message }, 500)
  }
})
