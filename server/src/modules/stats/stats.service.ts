import { supabaseAdmin } from '../../lib/supabase';
import { badRequest } from '../../utils/http-error';
import type { PersonalRecord, StrengthLog } from './stats.types';

export const getPersonalRecords = async (userId: string): Promise<PersonalRecord[]> => {
  const { data, error } = await supabaseAdmin
    .from('strength_logs')
    .select('*')
    .eq('user_id', userId)
    .order('one_rep_max', { ascending: false });

  if (error) {
    throw badRequest(`Failed to fetch strength logs: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Group by lift_name and take the first one (which is the max because of ordering)
  const recordsMap = new Map<string, StrengthLog>();

  (data as unknown as StrengthLog[]).forEach((log) => {
    if (!recordsMap.has(log.lift_name)) {
      recordsMap.set(log.lift_name, log);
    }
  });

  return Array.from(recordsMap.values()).map((log) => ({
    liftName: log.lift_name,
    oneRepMax: Number(log.one_rep_max),
    recordedAt: log.recorded_at,
  }));
};
