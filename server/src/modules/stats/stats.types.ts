import { z } from 'zod';

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

export const ALLOWED_EXERCISES = [
  'Bench Press',
  'Squat',
  'Clean',
  'Deadlift',
  'Overhead Press',
  '40 Yard Dash',
] as const;

export type AllowedExercise = (typeof ALLOWED_EXERCISES)[number];

export const createStrengthLogSchema = z.object({
  liftName: z.enum(ALLOWED_EXERCISES, {
    message: 'Invalid exercise name',
  }),
  oneRepMax: z.number().positive('One rep max must be a positive number'),
  recordedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type CreateStrengthLogDTO = z.infer<typeof createStrengthLogSchema>;
