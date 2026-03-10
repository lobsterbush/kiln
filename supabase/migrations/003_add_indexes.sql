-- Kiln: Add missing performance indexes
-- sessions.instructor_id is queried frequently:
--   - InstructorDashboard: all active/completed/past sessions
--   - InstructorSession: ownership check on loadSession
-- The initial schema only indexed join_code, not instructor_id.

CREATE INDEX IF NOT EXISTS idx_sessions_instructor ON sessions(instructor_id);
