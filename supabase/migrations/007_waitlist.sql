-- Migration 007: Pro waitlist email capture
--
-- Creates a public waitlist table that anonymous visitors can INSERT into
-- but cannot read. Instructors (authenticated users) also cannot read the
-- list — only the service role key (used from the Supabase dashboard) can.

CREATE TABLE IF NOT EXISTS waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  tier       TEXT NOT NULL DEFAULT 'pro' CHECK (tier IN ('pro', 'department')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate emails per tier
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_tier_uniq ON waitlist (email, tier);

-- RLS: enable but only allow inserts from anonymous (unauthenticated) or authenticated users.
-- No SELECT / UPDATE / DELETE for any role via the anon key.
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No SELECT policy — rows are invisible to all client-side roles.
-- Use the Supabase dashboard (service role) to view signups.
