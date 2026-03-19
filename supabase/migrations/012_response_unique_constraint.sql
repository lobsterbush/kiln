-- Migration 012: Add unique constraint on responses as defense-in-depth.
-- The submit_response() RPC already checks for duplicates, but this
-- ensures no race condition can produce two rows for the same round.

ALTER TABLE responses
  ADD CONSTRAINT responses_session_participant_round_unique
  UNIQUE (session_id, participant_id, round);
