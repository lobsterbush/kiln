/**
 * LTI 1.3 types and helpers for client-side code.
 */

/** Stored LTI launch context (matches lti_launches table). */
export interface LtiLaunch {
  platform_sub: string
  issuer: string
  client_id: string
  email?: string
  name?: string
  roles: string[]
  context_id?: string
  context_label?: string
  resource_link_id?: string
  ags_lineitem?: string
  ags_lineitems?: string
  launched_at: string
}

/** Check URL params for LTI launch indicators. */
export function isLtiLaunch(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.get('lti') === '1'
}

/** Extract LTI launch params from the URL. */
export function getLtiParams(): { sub: string; name: string; course: string } | null {
  const params = new URLSearchParams(window.location.search)
  if (params.get('lti') !== '1') return null
  return {
    sub: params.get('sub') ?? '',
    name: params.get('name') ?? '',
    course: params.get('course') ?? '',
  }
}
