export interface StrengthLog {
  id: string;
  user_id: string;
  lift_name: string;
  one_rep_max: number;
  recorded_at: string;
  notes?: string | null;
  created_at: string;
}

export interface PersonalRecord {
  liftName: string;
  oneRepMax: number;
  recordedAt: string;
}
