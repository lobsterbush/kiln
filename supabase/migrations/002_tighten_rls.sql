-- Kiln: RLS tightening + schema cleanup
-- 1. Fix activities type CHECK: remove unused evidence_eval and concept_synthesis
-- 2. Restrict responses SELECT to instructors (student content is private)
-- 3. Restrict peer_assignments to instructors
-- 4. Require responses INSERT to target an active session

-- ============================================================
-- Fix activities type constraint
-- ============================================================
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities
  ADD CONSTRAINT activities_type_check
  CHECK (type IN ('peer_critique', 'socratic_chain'));

-- ============================================================
-- Responses: restrict SELECT to session owner (instructor)
-- Unauthenticated students receive response content via
-- realtime broadcast events, not direct DB queries.
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read responses" ON responses;

CREATE POLICY "Instructors can read own session responses"
  ON responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = responses.session_id
        AND sessions.instructor_id = auth.uid()
    )
  );

-- Tighten responses INSERT: only allow into active/between_rounds sessions
DROP POLICY IF EXISTS "Participants can submit responses" ON responses;

CREATE POLICY "Participants can submit responses to active sessions"
  ON responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = responses.session_id
        AND sessions.status IN ('active', 'between_rounds')
    )
  );

-- ============================================================
-- Peer assignments: restrict to session owner
-- These are created by the instructor client and read only
-- in the Results page (instructor-only).
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read peer assignments" ON peer_assignments;
DROP POLICY IF EXISTS "System can create peer assignments" ON peer_assignments;

CREATE POLICY "Instructors can read own session peer assignments"
  ON peer_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = peer_assignments.session_id
        AND sessions.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can create peer assignments for own sessions"
  ON peer_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = peer_assignments.session_id
        AND sessions.instructor_id = auth.uid()
    )
  );

-- ============================================================
-- Follow-ups: restrict SELECT to session owner
-- Created by the edge function (service role, bypasses RLS).
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read follow-ups" ON follow_ups;
DROP POLICY IF EXISTS "System can create follow-ups" ON follow_ups;

CREATE POLICY "Instructors can read own session follow-ups"
  ON follow_ups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = follow_ups.session_id
        AND sessions.instructor_id = auth.uid()
    )
  );

-- ============================================================
-- Participants: keep SELECT open (needed for lobby UI shown
-- to unauthenticated students joining via join code).
-- ============================================================
-- No change to participants policies.
