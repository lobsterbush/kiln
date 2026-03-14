# Kiln — Pending Manual Steps

## Apply DB Migration 008

The CLI's direct Postgres connection times out on this network (IPv6 issue), so migration 008 must be applied manually.

1. Go to: https://supabase.com/dashboard/project/dlpazrbhsepjjsibwrpn/sql/new
2. Paste and run the full contents of `supabase/migrations/008_participant_feedback.sql`

This migration:
- Adds `ai_feedback TEXT` column to the `participants` table (`ADD COLUMN IF NOT EXISTS` — safe to re-run)
- Creates `get_participant_summary()` SECURITY DEFINER RPC used by the `/session/:id/summary` student page

Once applied, the student summary feature is fully live.

---

## Apply DB Migration 009

Same network issue — must be applied manually in Supabase Studio.

1. Go to: https://supabase.com/dashboard/project/dlpazrbhsepjjsibwrpn/sql/new
2. Paste and run the full contents of `supabase/migrations/009_scenarios.sql`

This migration:
- Creates `scenario_messages` table (per-turn transcript storage, RLS-protected)
- Creates `scenario_evaluations` table (per-participant rubric evaluations, RLS-protected)
- Creates `get_scenario_transcript()` SECURITY DEFINER RPC for student turn submission
- Adds RLS policies: students can insert/read their own messages; instructors can read/write all session data

Once applied, Scenario Solo and Scenario Multi activities are fully live.
