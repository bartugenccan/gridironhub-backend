-- Automatic profile creation triggers
-- Creates coach_profiles or player_profiles when a user is created with role metadata

-- Function to handle profile creation based on user role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
  full_name text;
begin
  -- Extract role from user metadata
  user_role := coalesce(
    (new.raw_user_meta_data->>'role')::text,
    (new.raw_app_meta_data->>'role')::text
  );
  
  -- Extract full_name from user metadata
  full_name := coalesce(
    (new.raw_user_meta_data->>'full_name')::text,
    ''
  );

  -- Create coach profile if role is coach
  if user_role = 'coach' then
    insert into public.coach_profiles (user_id, full_name)
    values (new.id, full_name)
    on conflict (user_id) do nothing;
  end if;

  -- Create player profile if role is player
  if user_role = 'player' then
    insert into public.player_profiles (user_id, full_name)
    values (new.id, full_name)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

-- Trigger on auth.users insert
-- Note: This trigger runs in the auth schema and requires appropriate permissions
-- In Supabase, this needs to be run as a migration or via the SQL editor
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Comment for migration order
comment on function public.handle_new_user() is 
  'Automatically creates coach_profiles or player_profiles when a user is created with role metadata';

