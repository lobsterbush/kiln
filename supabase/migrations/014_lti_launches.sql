-- LTI 1.3 launch context storage.
-- Stores claims from validated JWT id_tokens so that grade passback
-- can look up the AGS lineitem URL later.

CREATE TABLE IF NOT EXISTS lti_launches (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_sub     text NOT NULL,           -- sub claim from the platform JWT
  issuer           text NOT NULL,           -- iss (e.g. "https://canvas.instructure.com")
  client_id        text NOT NULL,
  email            text,
  name             text,
  roles            jsonb NOT NULL DEFAULT '[]',
  context_id       text,                    -- LMS course ID
  context_label    text,                    -- LMS course label (e.g. "POL101")
  resource_link_id text,
  ags_lineitem     text,                    -- AGS lineitem URL for grade passback
  ags_lineitems    text,                    -- AGS lineitems URL
  launched_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform_sub, issuer)
);

-- RLS: only service_role (edge functions) should access this table.
-- No direct client access needed.
ALTER TABLE lti_launches ENABLE ROW LEVEL SECURITY;

-- Allow the service_role key (used by edge functions) full access.
-- No policies for anon/authenticated — this table is backend-only.
CREATE POLICY "Service role full access"
  ON lti_launches
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for grade passback lookups
CREATE INDEX idx_lti_launches_sub_issuer ON lti_launches (platform_sub, issuer);
