import { supabaseAdmin } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { notFound } from '../../utils/http-error';
import type { RosterResponse, PlayerRosterMember, CoachRosterMember } from './roster.types';

/**
 * Fetches all active team members (coaches and players) for a given team
 * @param teamId - The UUID of the team
 * @returns RosterResponse containing separate arrays for coaches and players
 */
export const getTeamRoster = async (teamId: string): Promise<RosterResponse> => {
  try {
    // Verify team exists
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      logger.error({ error: teamError, teamId }, 'Team not found');
      throw notFound('Team not found');
    }

    // Fetch all active team members
    const { data: teamMembers, error: membersError } = await supabaseAdmin
      .from('team_members')
      .select('user_id, role, primary_position, jersey_number')
      .eq('team_id', teamId)
      .eq('status', 'active');

    if (membersError) {
      logger.error({ error: membersError, teamId }, 'Failed to fetch team members');
      throw membersError;
    }

    if (!teamMembers || teamMembers.length === 0) {
      return {
        teamId,
        coaches: [],
        players: [],
      };
    }

    // Separate player and coach user IDs
    const playerUserIds = teamMembers.filter((m) => m.role === 'player').map((m) => m.user_id);
    const coachUserIds = teamMembers.filter((m) => m.role === 'coach').map((m) => m.user_id);

    const players: PlayerRosterMember[] = [];
    const coaches: CoachRosterMember[] = [];

    // Fetch player profiles if there are any players
    if (playerUserIds.length > 0) {
      const { data: playerProfiles, error: playerProfilesError } = await supabaseAdmin
        .from('player_profiles')
        .select('user_id, full_name, position')
        .in('user_id', playerUserIds);

      if (playerProfilesError) {
        logger.error({ error: playerProfilesError, teamId }, 'Failed to fetch player profiles');
      } else if (playerProfiles) {
        // Create a map of user_id to profile data
        const profileMap = new Map(
          playerProfiles.map((p) => [
            p.user_id,
            { fullName: p.full_name || 'Unknown Player', position: p.position },
          ]),
        );

        // Build player roster members
        for (const member of teamMembers.filter((m) => m.role === 'player')) {
          const profile = profileMap.get(member.user_id);
          // Use profile position if available, otherwise fallback to team_member primary_position
          // The database column is 'position' in player_profiles.
          // User says it comes as ["TE"]. Standardize to string[]
          let posRaw = profile?.position ?? member.primary_position;

          let positionArray: string[] = [];
          if (Array.isArray(posRaw)) {
            positionArray = posRaw;
          } else if (typeof posRaw === 'string') {
            // If it looks like a JSON array string '["TE"]', parsing might be needed?
            // Or if it's just "TE", wrap it.
            // Supabase JS client usually parses JSON/Arrays automatically if column type is correct.
            // We'll trust it returns a string or array.
            // If it's a simple string "TE", wrap it.
            // If it is '["TE"]' string, we might need to parse. But usually pg driver does it.
            // Let's assume safely wrapping.
            positionArray = [posRaw];
          }

          players.push({
            id: member.user_id,
            fullName: profile?.fullName || 'Unknown Player',
            role: 'player',
            jerseyNumber: member.jersey_number,
            position: positionArray,
          });
        }
      }
    }

    // Fetch coach profiles if there are any coaches
    if (coachUserIds.length > 0) {
      const { data: coachProfiles, error: coachProfilesError } = await supabaseAdmin
        .from('coach_profiles')
        .select('user_id, full_name, preferred_positions')
        .in('user_id', coachUserIds);

      if (coachProfilesError) {
        logger.error({ error: coachProfilesError, teamId }, 'Failed to fetch coach profiles');
      } else if (coachProfiles) {
        // Create a map of user_id to profile
        const profileMap = new Map(
          coachProfiles.map((p) => [
            p.user_id,
            { fullName: p.full_name || 'Unknown Coach', positions: p.preferred_positions },
          ]),
        );

        // Build coach roster members
        for (const member of teamMembers.filter((m) => m.role === 'coach')) {
          const profile = profileMap.get(member.user_id);
          let posRaw = profile?.positions ?? member.primary_position;

          let positionArray: string[] = [];
          if (Array.isArray(posRaw)) {
            positionArray = posRaw;
          } else if (typeof posRaw === 'string') {
            positionArray = [posRaw];
          }

          coaches.push({
            id: member.user_id,
            fullName: profile?.fullName || 'Unknown Coach',
            role: 'coach',
            primaryPosition: positionArray,
          });
        }
      }
    }

    return {
      teamId,
      coaches,
      players,
    };
  } catch (error) {
    logger.error({ error, teamId }, 'Error fetching team roster');
    throw error;
  }
};
