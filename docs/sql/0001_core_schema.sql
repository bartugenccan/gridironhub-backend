-- GridironHub core schema for Supabase
-- Run in Supabase SQL editor or via CLI migrations.

-- Coach profiles -----------------------------------------------------------
create table if not exists public.coach_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  bio text,
  certifications text[],
  preferred_positions text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Player profiles ----------------------------------------------------------
create table if not exists public.player_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  jersey_number integer,
  position text,
  dominant_hand text,
  height_cm numeric,
  weight_kg numeric,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Teams --------------------------------------------------------------------
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text,
  organization text,
  created_by uuid references auth.users (id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.team_members (
  team_id uuid references public.teams (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  role text check (role in ('coach', 'player')),
  status text check (status in ('active', 'inactive', 'invited')),
  joined_at timestamptz default now(),
  primary_position text,
  jersey_number integer,
  primary key (team_id, user_id)
);

create table if not exists public.team_customizations (
  team_id uuid primary key references public.teams (id) on delete cascade,
  hero_title text,
  hero_message text,
  highlight_ids uuid[],
  announcements jsonb,
  resources jsonb,
  updated_by uuid references auth.users (id),
  updated_at timestamptz default now()
);

-- Trainings & drills -------------------------------------------------------
create table if not exists public.trainings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams (id) on delete cascade,
  title text,
  description text,
  start_at timestamptz,
  end_at timestamptz,
  location text,
  created_by uuid references auth.users (id),
  status text check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

create table if not exists public.training_assignments (
  training_id uuid references public.trainings (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  attendance text check (attendance in ('pending', 'attended', 'missed', 'excused')),
  completion_notes text,
  primary key (training_id, user_id)
);

create table if not exists public.drills (
  id uuid primary key default gen_random_uuid(),
  title text,
  instructions text,
  focus_positions text[],
  equipment text[],
  video_url text,
  created_by uuid references auth.users (id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.training_drills (
  training_id uuid references public.trainings (id) on delete cascade,
  drill_id uuid references public.drills (id) on delete cascade,
  sequence integer,
  notes text,
  primary key (training_id, drill_id)
);

-- Highlights ---------------------------------------------------------------
create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams (id) on delete cascade,
  uploaded_by uuid references auth.users (id),
  title text,
  description text,
  storage_path text,
  tags text[],
  published_at timestamptz,
  created_at timestamptz default now()
);

-- Player performance -------------------------------------------------------
create table if not exists public.strength_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  lift_name text,
  one_rep_max numeric,
  recorded_at date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  height_cm numeric,
  weight_kg numeric,
  body_fat_pct numeric,
  recorded_at date,
  created_at timestamptz default now()
);

-- Calendars ----------------------------------------------------------------
create table if not exists public.calendars (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams (id) on delete cascade,
  author_id uuid references auth.users (id),
  title text,
  description text,
  start_at timestamptz,
  end_at timestamptz,
  visibility text check (visibility in ('team', 'players', 'coaches')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

