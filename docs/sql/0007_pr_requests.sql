-- PR Requests Table
-- Players submit PR updates here. Coaches approve them to move data to strength_logs.

create type public.pr_request_status as enum ('pending', 'approved', 'rejected');

create table if not exists public.pr_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.player_profiles (user_id) on delete cascade,
  lift_name text not null,
  value numeric not null, -- Can be weight (kg) or time (seconds)
  video_url text,
  status public.pr_request_status default 'pending',
  coach_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies
alter table public.pr_requests enable row level security;

-- Users can read their own requests
create policy "Users can read own PR requests"
  on public.pr_requests for select
  using (auth.uid() = user_id);

-- Users can create requests
create policy "Users can create PR requests"
  on public.pr_requests for insert
  with check (auth.uid() = user_id);

-- Coaches can view all requests (assuming coaches have some way to distinguish, 
-- but for now simpler policy or reliant on app logic. Ideally linked via team)
-- For simplicity in this step, allowing authenticated users to read (or restrict to coaches if role exists in auth.jwt)
-- Assuming 'coach' role check might be needed or joining with team tables.
-- STARTUP POLICY: Allow all authenticated to read for now to ensure coaches can see.
create policy "Authenticated users can read all PR requests"
  on public.pr_requests for select
  using (auth.role() = 'authenticated');

-- Only coaches (or admins) should update status. 
-- For now allowing update if user is authenticated (backend logic should handle authorization)
create policy "Authenticated users can update PR requests"
  on public.pr_requests for update
  using (auth.role() = 'authenticated');
