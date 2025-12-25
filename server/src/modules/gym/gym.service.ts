import { supabaseAdmin } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { badRequest, conflict } from '../../utils/http-error';
import type { GymCheckin, CreateCheckinDTO } from './gym.types';

/**
 * Creates a new gym check-in for a user
 */
export const createCheckin = async (
  userId: string,
  teamId: string,
  data: CreateCheckinDTO,
): Promise<GymCheckin> => {
  try {
    const { data: checkin, error } = await supabaseAdmin
      .from('gym_checkins')
      .insert({
        user_id: userId,
        team_id: teamId,
        checkin_date: data.checkinDate,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw conflict('You have already checked in for this date');
      }
      logger.error({ error, userId, teamId }, 'Failed to create gym check-in');
      throw badRequest(`Failed to create check-in: ${error.message}`);
    }

    // Transform to camelCase
    return {
      id: checkin.id,
      userId: checkin.user_id,
      teamId: checkin.team_id,
      checkinDate: checkin.checkin_date,
      createdAt: checkin.created_at,
    };
  } catch (error) {
    logger.error({ error, userId, teamId }, 'Error in createCheckin');
    throw error;
  }
};

/**
 * Gets check-in history for a user
 */
export const getUserCheckins = async (
  userId: string,
  limit: number = 30,
): Promise<GymCheckin[]> => {
  try {
    const { data: checkins, error } = await supabaseAdmin
      .from('gym_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error({ error, userId }, 'Failed to fetch gym check-ins');
      throw badRequest(`Failed to fetch check-ins: ${error.message}`);
    }

    return (checkins || []).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      teamId: c.team_id,
      checkinDate: c.checkin_date,
      createdAt: c.created_at,
    }));
  } catch (error) {
    logger.error({ error, userId }, 'Error in getUserCheckins');
    throw error;
  }
};

/**
 * Gets check-in history for the entire team (Coach only)
 */
export const getTeamCheckins = async (
  teamId: string,
  limit: number = 100,
): Promise<GymCheckin[]> => {
  try {
    // 1. Fetch check-ins
    const { data: checkins, error } = await supabaseAdmin
      .from('gym_checkins')
      .select('*')
      .eq('team_id', teamId)
      .order('checkin_date', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error({ error, teamId }, 'Failed to fetch team gym check-ins');
      throw badRequest(`Failed to fetch team check-ins: ${error.message}`);
    }

    if (!checkins || checkins.length === 0) {
      return [];
    }

    // 2. Fetch player profiles for these users
    const userIds = Array.from(new Set(checkins.map((c: any) => c.user_id)));

    // Use maybeSingle if only one user, but here we expect multiple.
    // We'll query 'player_profiles' for these user IDs.
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('player_profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    if (profilesError) {
      logger.warn(
        { error: profilesError, teamId },
        'Failed to fetch player profiles for check-ins',
      );
      // Continue without names rather than failing entirely? Or fail?
      // Let's degrade gracefully.
    }

    const profilesMap = new Map<string, string>();
    if (profiles) {
      profiles.forEach((p: any) => {
        profilesMap.set(p.user_id, p.full_name);
      });
    }

    return checkins.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      teamId: c.team_id,
      checkinDate: c.checkin_date,
      createdAt: c.created_at,
      playerName: profilesMap.get(c.user_id) || 'Unknown',
    }));
  } catch (error) {
    logger.error({ error, teamId }, 'Error in getTeamCheckins');
    throw error;
  }
};
