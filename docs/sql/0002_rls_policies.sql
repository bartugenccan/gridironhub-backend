-- Row Level Security policies for GridironHub
-- Enable RLS and define basic access rules.

-- Coach profiles RLS -------------------------------------------------------
alter table public.coach_profiles enable row level security;

create policy "Coaches can view their profile"
on public.coach_profiles
for select
using (auth.uid() = user_id);

create policy "Coaches can update their profile"
on public.coach_profiles
for update
using (auth.uid() = user_id);

-- Player profiles RLS ------------------------------------------------------
alter table public.player_profiles enable row level security;

create policy "Players can view their profile"
on public.player_profiles
for select
using (auth.uid() = user_id);

create policy "Players can update their profile"
on public.player_profiles
for update
using (auth.uid() = user_id);

-- Team members RLS ---------------------------------------------------------
alter table public.team_members enable row level security;

create policy "Users can see their memberships"
on public.team_members
for select
using (auth.uid() = user_id);

-- Teams RLS ----------------------------------------------------------------
alter table public.teams enable row level security;

create policy "Members can view teams they belong to"
on public.teams
for select
using (
  exists (
    select 1
    from public.team_members tm
    where tm.team_id = teams.id
      and tm.user_id = auth.uid()
  )
);

create policy "Coaches can update teams they own"
on public.teams
for update
using (
  auth.uid() = created_by
);

-- Trainings RLS ------------------------------------------------------------
alter table public.trainings enable row level security;

create policy "Members can view trainings"
on public.trainings
for select
using (
  exists (
    select 1
    from public.team_members tm
    where tm.team_id = trainings.team_id
      and tm.user_id = auth.uid()
  )
);

create policy "Coaches can manage trainings"
on public.trainings
for insert
with check (
  exists (
    select 1
    from public.team_members tm
    where tm.team_id = trainings.team_id
      and tm.user_id = auth.uid()
      and tm.role = 'coach'
  )
);

create policy "Coaches can update trainings"
on public.trainings
for update
using (
  exists (
    select 1
    from public.team_members tm
    where tm.team_id = trainings.team_id
      and tm.user_id = auth.uid()
      and tm.role = 'coach'
  )
);

-- Highlights RLS -----------------------------------------------------------
alter table public.highlights enable row level security;

create policy "Members can view highlights"
on public.highlights
for select
using (
  exists (
    select 1
    from public.team_members tm
    where tm.team_id = highlights.team_id
      and tm.user_id = auth.uid()
  )
);

create policy "Coaches can manage highlights"
on public.highlights
for insert
with check (
  exists (
    select 1
    from public.team_members tm
    where tm.team_id = highlights.team_id
      and tm.user_id = auth.uid()
      and tm.role = 'coach'
  )
);

create policy "Coaches can update highlights"
on public.highlights
for update
using (
  exists (
    select 1
    from public.team_members tm
    where tm.team_id = highlights.team_id
      and tm.user_id = auth.uid()
      and tm.role = 'coach'
  )
);

-- Allow service role (backend) bypass --------------------------------------
-- Supabase automatically bypasses RLS for service role key, so no explicit policy needed.

