-- Default team seed: Sakarya Tatankaları
-- This team is created automatically for initial coach registration

-- Insert default team if it doesn't exist
insert into public.teams (name, level, organization)
values ('Sakarya Tatankaları', 'Turkish American Football League', 'Sakarya Tatankaları')
on conflict do nothing;

-- Note: If you need a specific UUID for the default team, use:
-- insert into public.teams (id, name, level, organization)
-- values ('<specific-uuid>', 'Sakarya Tatankaları', 'Turkish American Football League', 'Sakarya Tatankaları')
-- on conflict (id) do update set name = excluded.name;

-- To get the default team ID for use in application config:
-- select id from public.teams where name = 'Sakarya Tatankaları' limit 1;

