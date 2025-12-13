-- Fix PR Requests FK
-- This migration changes the foreign key from auth.users to public.player_profiles
-- This ensures PostgREST can detect the relationship for joins.

-- 1. Drop the old constraint if it exists (it's likely named implicitly or we just alter)
--    To be safe, we'll alter the column to point to the new table.
--    Note: player_profiles.user_id references auth.users(id), so the values are compatible.

alter table public.pr_requests
  drop constraint if exists pr_requests_user_id_fkey;

alter table public.pr_requests
  add constraint pr_requests_user_id_fkey
  foreign key (user_id)
  references public.player_profiles (user_id)
  on delete cascade;
