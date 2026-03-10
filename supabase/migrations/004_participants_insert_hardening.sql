-- Migration 004: Tighten participants INSERT policy
-- Prevents students from joining sessions that have already completed.

DROP POLICY IF EXISTS "Anyone can join a session" ON participants;

CREATE POLICY "Anyone can join an active or lobby session"
  ON participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_id
        AND sessions.status NOT IN ('completed')
    )
  );
