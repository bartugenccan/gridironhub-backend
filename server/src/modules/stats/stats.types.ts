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

export enum PrRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface PrRequest {
  id: string;
  user_id: string;
  lift_name: string;
  value: number;
  video_url?: string | null;
  status: PrRequestStatus;
  coach_notes?: string | null;
  created_at: string;
  updated_at: string;
  strength_log_id?: string | null; // For updates to existing logs
  // Joins
  player_name?: string; // For display purposes
}

export const createPrRequestSchema = z.object({
  liftName: z.enum(ALLOWED_EXERCISES, {
    message: 'Invalid exercise name',
  }),
  value: z.number().positive('Value must be a positive number'),
  videoUrl: z.string().url({ message: 'Valid video URL is required' }),
  strengthLogId: z.string().uuid().optional(),
});

export type CreatePrRequestDTO = z.infer<typeof createPrRequestSchema>;

export const updatePrRequestStatusSchema = z.object({
  status: z.enum([PrRequestStatus.APPROVED, PrRequestStatus.REJECTED]),
  coachNotes: z.string().optional(),
});

export type UpdatePrRequestStatusDTO = z.infer<typeof updatePrRequestStatusSchema>;
