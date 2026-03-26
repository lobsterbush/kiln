-- Allow deleting an activity to cascade-delete its sessions (and their
-- dependent rows: participants, responses, peer_assignments, follow_ups,
-- scenario_messages, scenario_evaluations).

-- Step 1: Drop the existing FK and re-add with CASCADE
ALTER TABLE sessions
  DROP CONSTRAINT sessions_activity_id_fkey,
  ADD CONSTRAINT sessions_activity_id_fkey
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE;
