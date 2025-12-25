import { supabaseAdmin } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import type { PlayerPrs, PrValue } from './profiles.schemas';

// Valid lift names
const VALID_LIFTS = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Overhead Press',
  'Clean',
  '40-Yard Dash',
] as const;

interface StrengthLogRow {
  lift_name: string | null;
  one_rep_max: number | null;
  recorded_at: string | null;
}

/**
 * Fetches player PRs (Personal Records) for compound lifts from strength_logs table
 * Returns the maximum one_rep_max for each lift type
 */
export const getPlayerPrs = async (userId: string): Promise<PlayerPrs> => {
  try {
    // Query all strength logs for this player
    const { data: logs, error } = await supabaseAdmin
      .from('strength_logs')
      .select('lift_name, one_rep_max, recorded_at')
      .eq('user_id', userId)
      .in('lift_name', [...VALID_LIFTS]);

    if (error) {
      logger.error({ error, userId }, 'Failed to fetch player PRs');
      throw error;
    }

    // Group by lift name and find max PR for each
    const prMap: Record<string, { max: number; recordedAt: string | null }> = {};

    if (logs) {
      for (const log of logs as StrengthLogRow[]) {
        const liftName = log.lift_name;
        if (!liftName || !VALID_LIFTS.includes(liftName as (typeof VALID_LIFTS)[number])) {
          continue;
        }

        const oneRepMax = log.one_rep_max ? Number(log.one_rep_max) : 0;
        if (oneRepMax <= 0) continue;

        const existing = prMap[liftName];

        // Logic for 40-Yard Dash (lower is better)
        if (liftName === '40-Yard Dash') {
          if (!existing || oneRepMax < existing.max) {
            const recordedAt = log.recorded_at
              ? new Date(log.recorded_at).toISOString().split('T')[0]
              : null;
            prMap[liftName] = {
              max: oneRepMax,
              recordedAt,
            };
          }
        } else {
          // Logic for other lifts (higher is better)
          if (!existing || oneRepMax > existing.max) {
            const recordedAt = log.recorded_at
              ? new Date(log.recorded_at).toISOString().split('T')[0]
              : null;
            prMap[liftName] = {
              max: oneRepMax,
              recordedAt,
            };
          }
        }
      }
    }

    // Helper to create PrValue
    const createPrValue = (lift: string): PrValue | null => {
      const data = prMap[lift];
      if (!data) return null;
      return {
        value: data.max,
        recordedAt: data.recordedAt || '',
      };
    };

    // Build response with proper keys
    const prs: PlayerPrs = {
      benchPress: createPrValue('Bench Press'),
      squat: createPrValue('Squat'),
      deadlift: createPrValue('Deadlift'),
      overheadPress: createPrValue('Overhead Press'),
      clean: createPrValue('Clean'),
      fortyYardDash: createPrValue('40-Yard Dash'),
    };

    return prs;
  } catch (error) {
    logger.error({ error, userId }, 'Error fetching player PRs');
    // Return empty PRs on error
    return {
      benchPress: null,
      squat: null,
      deadlift: null,
      overheadPress: null,
      clean: null,
      fortyYardDash: null,
    };
  }
};
