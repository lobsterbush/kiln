-- Migration 006: Add peer_clarification and evidence_analysis activity types
--
-- Changes:
--   1. Extend activities.type CHECK to include both new types
--   2. Extend responses.response_type CHECK to include 'clarification' and 'evidence_gap'
--   3. Replace get_student_round_context() with an updated version that handles
--      recovery for both new activity types on mid-session page refresh

-- ============================================================
-- 1. Extend activities.type CHECK
-- ============================================================
ALTER TABLE activities
  DROP CONSTRAINT IF EXISTS activities_type_check;

ALTER TABLE activities
  ADD CONSTRAINT activities_type_check
  CHECK (type IN (
    'peer_critique', 'socratic_chain', 'evidence_eval', 'concept_synthesis',
    'peer_clarification', 'evidence_analysis'
  ));

-- ============================================================
-- 2. Extend responses.response_type CHECK
-- ============================================================
ALTER TABLE responses
  DROP CONSTRAINT IF EXISTS responses_response_type_check;

ALTER TABLE responses
  ADD CONSTRAINT responses_response_type_check
  CHECK (response_type IN (
    'initial', 'critique', 'rebuttal', 'followup_answer',
    'clarification', 'evidence_gap'
  ));

-- ============================================================
-- 3. Update get_student_round_context()
--
-- New branches added:
--   peer_clarification round 2: reviewer = explainer, author = confused student
--     → returns author's round-1 confusion as peer_response_content,
--       peer_response_type = 'clarification'
--   evidence_analysis round 2: reviewer = gap-identifier, author = interpreter
--     → returns author's round-1 interpretation as peer_response_content,
--       peer_response_type = 'evidence_gap'
--
-- Both new branches follow the same peer_assignments lookup pattern as
-- peer_critique round 2.
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
        'already_submitted',     false,
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
        'already_submitted',     false,
        'peer_response_content', v_peer_response,
        'peer_name',             COALESCE(v_peer_name, 'Peer critique'),
        'peer_response_type',    'rebuttal'
      );
    END IF;
  END IF;

  -- Peer clarification: round 2 (explanation phase)
  -- reviewer = the student explaining, author = the confused student
  IF p_activity_type = 'peer_clarification' AND p_round = 2 THEN
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
        'already_submitted',     false,
        'peer_response_content', v_peer_response,
        'peer_name',             COALESCE(v_peer_name, 'A classmate'),
        'peer_response_type',    'clarification'
      );
    END IF;
  END IF;

  -- Evidence analysis: round 2 (gap identification phase)
  -- reviewer = the gap-identifier, author = the student who interpreted the evidence
  IF p_activity_type = 'evidence_analysis' AND p_round = 2 THEN
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
        'already_submitted',     false,
        'peer_response_content', v_peer_response,
        'peer_name',             COALESCE(v_peer_name, 'A classmate'),
        'peer_response_type',    'evidence_gap'
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
