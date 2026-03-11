-- Migration 005: Enforce student token validation server-side
--
-- Problem: the responses INSERT policy only checked that the session was active.
-- Any anon caller who knew a participant_id could insert responses as that student.
-- The token stored in participants.token was never validated in any policy.
--
-- Solution: replace the permissive INSERT policy with two SECURITY DEFINER
-- functions that validate the token before allowing any write or data read.
-- The functions run as the DB owner (bypassing RLS), but only after verifying
-- that p_token matches participants.token for the given p_participant_id.

-- ============================================================
-- 1. submit_response
--    Validates student token then inserts a response.
--    Replaces the direct anon INSERT on the responses table.
-- ============================================================
CREATE OR REPLACE FUNCTION submit_response(
  p_token           TEXT,
  p_session_id      UUID,
  p_participant_id  UUID,
  p_round           INT,
  p_content         TEXT,
  p_response_type   TEXT,
  p_time_taken_ms   INT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_response_id UUID;
BEGIN
  -- Validate participant token
  IF NOT EXISTS (
    SELECT 1 FROM participants
    WHERE id = p_participant_id AND token = p_token
  ) THEN
    RAISE EXCEPTION 'Invalid participant token' USING ERRCODE = 'P0001';
  END IF;

  -- Validate session is accepting responses
  IF NOT EXISTS (
    SELECT 1 FROM sessions
    WHERE id = p_session_id
      AND status IN ('active', 'between_rounds')
  ) THEN
    RAISE EXCEPTION 'Session is not active' USING ERRCODE = 'P0002';
  END IF;

  -- Prevent duplicate submissions for the same round
  IF EXISTS (
    SELECT 1 FROM responses
    WHERE session_id = p_session_id
      AND participant_id = p_participant_id
      AND round = p_round
  ) THEN
    RAISE EXCEPTION 'Already submitted for this round' USING ERRCODE = 'P0003';
  END IF;

  INSERT INTO responses (session_id, participant_id, round, content, response_type, time_taken_ms)
  VALUES (p_session_id, p_participant_id, p_round, p_content, p_response_type, p_time_taken_ms)
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$;

-- ============================================================
-- 2. get_student_round_context
--    Validates student token then returns the data needed for
--    session recovery (refresh mid-session).
--    Returns a JSONB with:
--      { already_submitted: bool }                         — if already done
--      { already_submitted: false,
--        peer_response_content, peer_name,
--        peer_response_type }                              — peer critique/rebuttal round
--      { already_submitted: false, follow_up_prompt }     — Socratic chain round
--      { already_submitted: false }                        — no recovery context yet
-- ============================================================
CREATE OR REPLACE FUNCTION get_student_round_context(
  p_participant_id  UUID,
  p_token           TEXT,
  p_session_id      UUID,
  p_round           INT,
  p_activity_type   TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_submitted BOOLEAN;
  v_response_id       UUID;
  v_author_id         UUID;
  v_reviewer_id       UUID;
  v_peer_response     TEXT;
  v_peer_name         TEXT;
  v_follow_up         TEXT;
BEGIN
  -- Validate token
  IF NOT EXISTS (
    SELECT 1 FROM participants
    WHERE id = p_participant_id AND token = p_token
  ) THEN
    RAISE EXCEPTION 'Invalid participant token';
  END IF;

  -- Check if already submitted this round
  SELECT EXISTS(
    SELECT 1 FROM responses
    WHERE session_id    = p_session_id
      AND participant_id = p_participant_id
      AND round          = p_round
  ) INTO v_already_submitted;

  IF v_already_submitted THEN
    RETURN jsonb_build_object('already_submitted', true);
  END IF;

  -- Peer critique: round 2 (critique phase)
  IF p_activity_type = 'peer_critique' AND p_round = 2 THEN
    SELECT pa.response_id, pa.author_id
      INTO v_response_id, v_author_id
    FROM peer_assignments pa
    WHERE pa.session_id  = p_session_id
      AND pa.reviewer_id = p_participant_id
      AND pa.round       = 1
    LIMIT 1;

    IF v_response_id IS NOT NULL THEN
      SELECT r.content INTO v_peer_response
        FROM responses r WHERE r.id = v_response_id;
      SELECT p.display_name INTO v_peer_name
        FROM participants p WHERE p.id = v_author_id;

      RETURN jsonb_build_object(
        'already_submitted',    false,
        'peer_response_content', v_peer_response,
        'peer_name',             COALESCE(v_peer_name, 'A classmate'),
        'peer_response_type',    'critique'
      );
    END IF;
  END IF;

  -- Peer critique: round 3 (rebuttal phase)
  IF p_activity_type = 'peer_critique' AND p_round = 3 THEN
    SELECT pa.reviewer_id INTO v_reviewer_id
    FROM peer_assignments pa
    WHERE pa.session_id = p_session_id
      AND pa.author_id  = p_participant_id
      AND pa.round      = 1
    LIMIT 1;

    IF v_reviewer_id IS NOT NULL THEN
      SELECT r.content INTO v_peer_response
        FROM responses r
       WHERE r.session_id     = p_session_id
         AND r.participant_id = v_reviewer_id
         AND r.round          = 2
      LIMIT 1;
      SELECT p.display_name INTO v_peer_name
        FROM participants p WHERE p.id = v_reviewer_id;

      RETURN jsonb_build_object(
        'already_submitted',    false,
        'peer_response_content', v_peer_response,
        'peer_name',             COALESCE(v_peer_name, 'Peer critique'),
        'peer_response_type',    'rebuttal'
      );
    END IF;
  END IF;

  -- Socratic chain: round 2+
  IF p_activity_type = 'socratic_chain' AND p_round > 1 THEN
    SELECT fu.prompt INTO v_follow_up
    FROM follow_ups fu
    WHERE fu.session_id     = p_session_id
      AND fu.participant_id = p_participant_id
      AND fu.round          = p_round - 1
    LIMIT 1;

    IF v_follow_up IS NOT NULL THEN
      RETURN jsonb_build_object(
        'already_submitted', false,
        'follow_up_prompt',  v_follow_up
      );
    END IF;
  END IF;

  -- No specific context available yet
  RETURN jsonb_build_object('already_submitted', false);
END;
$$;

-- ============================================================
-- 3. Remove the permissive anon INSERT policy on responses.
--    Direct inserts from the anon key are now fully blocked.
--    Only submit_response() (SECURITY DEFINER) can insert.
-- ============================================================
DROP POLICY IF EXISTS "Participants can submit responses to active sessions" ON responses;
