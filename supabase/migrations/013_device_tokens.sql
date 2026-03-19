-- Device tokens for push notifications (APNs for iOS).
-- One row per user per platform; upserted on each sign-in.

CREATE TABLE IF NOT EXISTS device_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      text NOT NULL,
  platform   text NOT NULL DEFAULT 'ios',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

-- RLS: instructors can manage their own tokens
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own device tokens"
  ON device_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for looking up tokens by user (used when sending notifications)
CREATE INDEX idx_device_tokens_user ON device_tokens (user_id);
