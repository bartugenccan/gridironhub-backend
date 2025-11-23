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

    // Fetch active players with their profiles
    const { data: playerMembers, error: playersError } = await supabaseAdmin
      .from('team_members')
      .select(
        `
        user_id,
        primary_position,
        jersey_number,
        player_profiles!inner(full_name)
      `,
      )
      .eq('team_id', teamId)
      .eq('role', 'player')
      .eq('status', 'active');

    if (playersError) {
      logger.error({ error: playersError, teamId }, 'Failed to fetch players');
      throw playersError;
    }

    // Fetch active coaches with their profiles
    const { data: coachMembers, error: coachesError } = await supabaseAdmin
      .from('team_members')
      .select(
        `
        user_id,
        primary_position,
        coach_profiles!inner(full_name)
      `,
      )
      .eq('team_id', teamId)
      .eq('role', 'coach')
      .eq('status', 'active');

    if (coachesError) {
      logger.error({ error: coachesError, teamId }, 'Failed to fetch coaches');
      throw coachesError;
    }

    const players: PlayerRosterMember[] = [];
    const coaches: CoachRosterMember[] = [];

    // Process players
    if (playerMembers) {
      for (const member of playerMembers) {
        const playerData = member as {
          user_id: string;
          primary_position: string | null;
          jersey_number: number | null;
          player_profiles: { full_name: string | null }[];
        };

        const fullName =
          playerData.player_profiles && playerData.player_profiles.length > 0
            ? playerData.player_profiles[0].full_name || 'Unknown Player'
            : 'Unknown Player';

        players.push({
          id: playerData.user_id,
          fullName,
          role: 'player',
          jerseyNumber: playerData.jersey_number,
          position: playerData.primary_position,
        });
      }
    }

    // Process coaches
    if (coachMembers) {
      for (const member of coachMembers) {
        const coachData = member as {
          user_id: string;
          primary_position: string | null;
          coach_profiles: { full_name: string | null }[];
        };

        const fullName =
          coachData.coach_profiles && coachData.coach_profiles.length > 0
            ? coachData.coach_profiles[0].full_name || 'Unknown Coach'
            : 'Unknown Coach';

        coaches.push({
          id: coachData.user_id,
          fullName,
          role: 'coach',
          primaryPosition: coachData.primary_position,
        });
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
