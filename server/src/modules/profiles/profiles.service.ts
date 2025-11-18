import { supabaseAdmin } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import type { PlayerPrs, PrValue } from './profiles.schemas';

// Valid lift names
const VALID_LIFTS = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press'] as const;

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

    // Build response with proper keys
    const prs: PlayerPrs = {
      benchPress: prMap['Bench Press']
        ? ({
            value: prMap['Bench Press'].max,
            recordedAt: prMap['Bench Press'].recordedAt || '',
          } as PrValue)
        : null,
      squat: prMap['Squat']
        ? ({
            value: prMap['Squat'].max,
            recordedAt: prMap['Squat'].recordedAt || '',
          } as PrValue)
        : null,
      deadlift: prMap['Deadlift']
        ? ({
            value: prMap['Deadlift'].max,
            recordedAt: prMap['Deadlift'].recordedAt || '',
          } as PrValue)
        : null,
      overheadPress: prMap['Overhead Press']
        ? ({
            value: prMap['Overhead Press'].max,
            recordedAt: prMap['Overhead Press'].recordedAt || '',
          } as PrValue)
        : null,
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
    };
  }
};
