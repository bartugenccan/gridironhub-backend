import { supabaseAdmin } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { badRequest } from '../../utils/http-error';

export interface TeamSummary {
  id: string;
  name: string;
}

export const getAllTeams = async (): Promise<TeamSummary[]> => {
  const { data, error } = await supabaseAdmin.from('teams').select('id, name').order('name');

  if (error) {
    logger.error({ error }, 'Failed to fetch teams');
    throw badRequest('Failed to fetch teams');
  }

  return data as TeamSummary[];
  return data as TeamSummary[];
};

export interface TeamMember {
  userId: string;
  fullName: string;
  role: string;
  status: string;
  primaryPosition?: string[];
  jerseyNumber?: number;
  email?: string; // We might want to include email for coaches to identify players
}

export const getTeamMembers = async (teamId: string, status?: string): Promise<TeamMember[]> => {
  // 1. Fetch team members first
  logger.debug({ teamId, status }, 'Fetching team members');
  let query = supabaseAdmin
    .from('team_members')
    .select('user_id, role, status, primary_position, jersey_number')
    .eq('team_id', teamId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: members, error } = await query;

  if (error) {
    logger.error({ error, teamId }, 'Failed to fetch team members query');
    throw badRequest(`Failed to fetch team members: ${error.message}`);
  }

  if (!members || members.length === 0) {
    logger.debug({ teamId }, 'No members found');
    return [];
  }

  logger.debug({ count: members.length }, 'Found members');

  // 2. Separate IDs by role
  const playerIds = members.filter((m) => m.role === 'player').map((m) => m.user_id);

  const coachIds = members.filter((m) => m.role === 'coach').map((m) => m.user_id);

  // 3. Fetch profiles in parallel
  logger.debug({ playerCount: playerIds.length, coachCount: coachIds.length }, 'Fetching profiles');

  try {
    const [playerProfilesRes, coachProfilesRes] = await Promise.all([
      playerIds.length > 0
        ? supabaseAdmin
            .from('player_profiles')
            .select('user_id, full_name')
            .in('user_id', playerIds)
        : Promise.resolve({ data: [], error: null }),
      coachIds.length > 0
        ? supabaseAdmin.from('coach_profiles').select('user_id, full_name').in('user_id', coachIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (playerProfilesRes.error) {
      logger.error({ error: playerProfilesRes.error }, 'Error fetching player profiles');
    }
    if (coachProfilesRes.error) {
      logger.error({ error: coachProfilesRes.error }, 'Error fetching coach profiles');
    }

    // Map for quick lookup
    const namesMap = new Map<string, string>();

    // Check data existence before iterating
    const playerData = playerProfilesRes.data || [];
    const coachData = coachProfilesRes.data || [];

    playerData.forEach((p: any) => {
      if (p && p.user_id) namesMap.set(p.user_id, p.full_name || 'Unknown');
    });
    coachData.forEach((c: any) => {
      if (c && c.user_id) namesMap.set(c.user_id, c.full_name || 'Unknown');
    });

    // 4. Merge data
    return members.map((member) => {
      const name = namesMap.get(member.user_id) || 'Unknown';
      return {
        userId: member.user_id,
        role: member.role,
        status: member.status,
        primaryPosition: member.primary_position,
        jerseyNumber: member.jersey_number,
        fullName: name,
      };
    });
  } catch (err: any) {
    logger.error({ err }, 'Unexpected error processing team members');
    throw badRequest(`Processing error: ${err.message}`);
  }
};
