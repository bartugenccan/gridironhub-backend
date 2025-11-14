-- Team assignment trigger
-- Automatically assigns invited coaches and registered players to their selected team

-- Function to handle team assignment for coaches and players
create or replace function public.handle_team_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
  team_id_val uuid;
  position_val text;
begin
  -- Extract role from user metadata
  user_role := coalesce(
    (new.raw_user_meta_data->>'role')::text,
    (new.raw_app_meta_data->>'role')::text
  );

  -- Only process coaches and players
  if user_role not in ('coach', 'player') then
    return new;
  end if;

  -- Extract team_id and position from metadata
  team_id_val := nullif(
    coalesce(
      (new.raw_user_meta_data->>'team_id')::text,
      (new.raw_app_meta_data->>'team_id')::text
    ),
    ''
  )::uuid;

  position_val := coalesce(
    (new.raw_user_meta_data->>'position')::text,
    (new.raw_app_meta_data->>'position')::text
  );

  -- If team_id is provided in metadata, assign user to team
  if team_id_val is not null then
    -- Verify team exists
    if exists (select 1 from public.teams where id = team_id_val) then
      -- Insert team assignment (on conflict do update to avoid duplicates)
      insert into public.team_members (
        team_id,
        user_id,
        role,
        status,
        primary_position
      )
      values (
        team_id_val,
        new.id,
        user_role,
        'active',
        position_val
      )
      on conflict (team_id, user_id) do update
      set
        status = 'active',
        primary_position = coalesce(position_val, team_members.primary_position);
    else
      -- Log warning if team doesn't exist
      raise notice 'Team % not found for % assignment (user_id: %)', team_id_val, user_role, new.id;
    end if;
  end if;

  return new;
end;
$$;

-- Trigger on auth.users insert
-- Note: This trigger runs in the auth schema and requires appropriate permissions
-- In Supabase, this needs to be run as a migration or via the SQL editor
drop trigger if exists on_auth_user_team_assignment on auth.users;
create trigger on_auth_user_team_assignment
  after insert on auth.users
  for each row
  execute function public.handle_team_assignment();

-- Comment for migration order
comment on function public.handle_team_assignment() is 
  'Automatically assigns invited coaches and registered players to their selected team when user is created with team_id in metadata';

