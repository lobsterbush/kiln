-- 010_feedback.sql
-- Stores user-submitted feedback from the in-app feedback form.

create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  email       text,
  category    text not null default 'general'
              check (category in ('bug', 'feature', 'general', 'other')),
  message     text not null,
  created_at  timestamptz not null default now()
);

-- Anyone (logged in or anonymous) can insert feedback.
-- Only the service role can read it (for admin use).
alter table feedback enable row level security;

create policy "Anyone can submit feedback"
  on feedback for insert
  to anon, authenticated
  with check (true);
