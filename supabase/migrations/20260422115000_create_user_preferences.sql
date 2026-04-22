-- User preference profile used by job-fit analysis.
-- Important: We do NOT store job descriptions, scores, or analysis outputs.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  experience_years integer not null default 0 check (experience_years >= 0 and experience_years <= 60),
  roles text[] not null default '{}'::text[],
  tech_stack text[] not null default '{}'::text[],
  locations text[] not null default '{}'::text[],
  work_type text[] not null default '{}'::text[] check (
    work_type <@ array['remote', 'hybrid', 'onsite']::text[]
  ),
  min_salary text not null default '',
  deal_breakers text[] not null default '{}'::text[],
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.user_preferences is
  'Saved user preferences used for LLM fit analysis. No job data or scores are persisted.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_user_preferences_updated_at on public.user_preferences;
create trigger set_user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

alter table public.user_preferences enable row level security;

drop policy if exists user_preferences_select_own on public.user_preferences;
create policy user_preferences_select_own
on public.user_preferences
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists user_preferences_insert_own on public.user_preferences;
create policy user_preferences_insert_own
on public.user_preferences
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists user_preferences_update_own on public.user_preferences;
create policy user_preferences_update_own
on public.user_preferences
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
