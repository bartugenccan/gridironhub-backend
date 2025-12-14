import { z } from 'zod';

// Lift type constants
export const liftTypes = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Overhead Press',
  'Clean',
  '40-Yard Dash',
] as const;

export type LiftType = (typeof liftTypes)[number];

// PR data structure
export const prValueSchema = z.object({
  value: z.number().positive(),
  recordedAt: z.string().date(),
});

export type PrValue = z.infer<typeof prValueSchema>;

export const playerPrsSchema = z.object({
  benchPress: prValueSchema.nullable(),
  squat: prValueSchema.nullable(),
  deadlift: prValueSchema.nullable(),
  overheadPress: prValueSchema.nullable(),
  clean: prValueSchema.nullable(),
  fortyYardDash: prValueSchema.nullable(),
});

export type PlayerPrs = z.infer<typeof playerPrsSchema>;

export const profileParamsSchema = z.object({
  id: z.string().uuid('Profile id must be a valid UUID'),
});

export const playerProfileUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  jerseyNumber: z.number().int().positive().optional(),
  position: z.string().min(1).optional(),
  dominantHand: z.enum(['left', 'right', 'ambidextrous']).optional(),
  heightCm: z.number().int().positive().optional(),
  weightKg: z.number().int().positive().optional(),
  bio: z.string().max(1000).optional(),
  teamId: z.string().uuid().optional(),
});

export const coachProfileUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  bio: z.string().max(1000).optional(),
  certifications: z.array(z.string()).optional(),
  preferredPositions: z.array(z.string()).optional(),
  yearsOfExperience: z.number().int().optional(),
});

export type PlayerProfileUpdate = z.infer<typeof playerProfileUpdateSchema>;
export type CoachProfileUpdate = z.infer<typeof coachProfileUpdateSchema>;

// Player profile response schema
export const playerProfileResponseSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().nullable(),
  jerseyNumber: z.number().int().nullable(),
  position: z.string().nullable(),
  dominantHand: z.string().nullable(),
  heightCm: z.number().nullable(),
  weightKg: z.number().nullable(),
  bio: z.string().nullable(),
  prs: playerPrsSchema,
});

export type PlayerProfileResponse = z.infer<typeof playerProfileResponseSchema>;

export const coachProfileResponseSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().nullable(),
  bio: z.string().nullable(),
  certifications: z.array(z.string()).nullable(),
  preferredPositions: z.array(z.string()).nullable(),
  currentTeam: z.string().nullable(),
  yearsOfExperience: z.number().int().nullable(),
});

export type CoachProfileResponse = z.infer<typeof coachProfileResponseSchema>;
