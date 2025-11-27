-- GridironHub workouts table
-- Migration to add workouts feature with team-wide and position-specific assignments

-- Workouts table ------------------------------------------------------------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null,
  description text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  assigned_to_positions text[], -- NULL or empty array means team-wide workout
  difficulty_level text check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  equipment_needed text[],
  created_by uuid not null references auth.users (id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_active boolean default true
);

-- Indexes for better query performance
create index if not exists idx_workouts_team_id on public.workouts (team_id);
create index if not exists idx_workouts_is_active on public.workouts (is_active);
create index if not exists idx_workouts_assigned_positions on public.workouts using gin (assigned_to_positions);

-- Comments for documentation
comment on table public.workouts is 'Stores workout programs for teams with optional position-specific assignments';
comment on column public.workouts.assigned_to_positions is 'Array of positions (e.g., QB, WR). NULL or empty means team-wide workout';
comment on column public.workouts.is_active is 'Soft delete flag. False means workout is deleted';
