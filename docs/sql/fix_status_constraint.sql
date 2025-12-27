-- Drop the old constraint
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_status_check;

-- Add the new constraint with valid statuses (removed 'rejected' as per requirement)
ALTER TABLE public.team_members ADD CONSTRAINT team_members_status_check 
CHECK (status IN ('active', 'inactive', 'invited', 'pending'));
