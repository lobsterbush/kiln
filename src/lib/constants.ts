/** Default prompt shown to students who are critiquing a peer's argument */
export const DEFAULT_CRITIQUE_PROMPT =
  'Read the argument below carefully. Identify its weakest assumption or unsupported claim.'

/** Default prompt shown to students writing a rebuttal to a peer critique */
export const DEFAULT_REBUTTAL_PROMPT =
  "Below is a peer's critique of your original argument. Write a rebuttal defending your position."

/** Fallback prompt shown to students when AI follow-up generation fails or times out */
export const FALLBACK_FOLLOW_UP_PROMPT =
  'Reflect on your initial response: what is the weakest part of your argument, and how would you strengthen it?'

/** How long (ms) to wait for AI follow-up generation before showing the fallback prompt */
export const FOLLOW_UP_TIMEOUT_MS = 30_000
