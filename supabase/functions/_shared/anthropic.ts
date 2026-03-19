/**
 * Shared Anthropic API helper with retry + exponential backoff.
 *
 * Usage:
 *   import { callClaude } from '../_shared/anthropic.ts'
 *   const data = await callClaude(apiKey, { model, max_tokens, system, messages })
 */

interface ClaudeRequest {
  model: string
  max_tokens: number
  system: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

interface ClaudeResponse {
  content?: Array<{ text: string }>
  error?: { message: string }
}

const MAX_RETRIES = 2
const INITIAL_DELAY_MS = 1000

/**
 * Calls the Anthropic Messages API with automatic retry on transient errors
 * (429 rate-limit, 503/529 overloaded, network failures).
 *
 * Returns the parsed JSON response body. Throws on non-retryable errors
 * or after all retries are exhausted.
 */
export async function callClaude(
  apiKey: string,
  body: ClaudeRequest,
): Promise<ClaudeResponse> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      })

      // Non-retryable client errors (400, 401, 403, 404)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        const data = await res.json()
        throw new Error(
          `Anthropic API ${res.status}: ${data?.error?.message ?? res.statusText}`,
        )
      }

      // Retryable: 429 (rate limit), 503/529 (overloaded)
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = res.headers.get('retry-after')
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : INITIAL_DELAY_MS * Math.pow(2, attempt)
        lastError = new Error(`Anthropic API ${res.status}`)
        if (attempt < MAX_RETRIES) {
          await sleep(delay)
          continue
        }
        throw lastError
      }

      return await res.json()
    } catch (err) {
      // Network-level failures (DNS, timeout, etc.) are retryable
      if (err instanceof TypeError && attempt < MAX_RETRIES) {
        lastError = err
        await sleep(INITIAL_DELAY_MS * Math.pow(2, attempt))
        continue
      }
      throw err
    }
  }

  throw lastError ?? new Error('Anthropic API call failed')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
