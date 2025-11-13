import { z } from 'zod';

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
});

export type PlayerProfileUpdate = z.infer<typeof playerProfileUpdateSchema>;
export type CoachProfileUpdate = z.infer<typeof coachProfileUpdateSchema>;
