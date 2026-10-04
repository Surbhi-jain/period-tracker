-- Luna database schema for a new Supabase project.
-- Run once in Supabase → SQL Editor. Existing projects should run the
-- dated files in supabase/migrations/ instead.

create table if not exists periods (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email)),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date),
  check ((end_date - start_date) < 20)
);

create index if not exists periods_email_start_date_idx
  on periods (email, start_date desc);

-- Luna's server signs people in with Google (Auth.js) and talks to the
-- database with the service_role key, which bypasses row-level security.
-- Turning RLS on with no policies blocks the public anon key completely.
alter table periods enable row level security;
