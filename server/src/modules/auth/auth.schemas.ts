import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.enum(['coach', 'player']),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshBody = z.infer<typeof refreshBodySchema>;

export const registerBodySchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;

export const coachPositions = [
  'Head Coach',
  'Offensive Coordinator',
  'Defensive Coordinator',
  'Special Teams Coach',
  'Quarterbacks Coach',
  'Running Backs Coach',
  'Wide Receivers Coach',
  'Tight Ends Coach',
  'Offensive Line Coach',
  'Defensive Line Coach',
  'Linebackers Coach',
  'Defensive Backs Coach',
  'Strength and Conditioning Coach',
  'Assistant Coach',
] as const;

export type CoachPosition = (typeof coachPositions)[number];

export const inviteCoachBodySchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  teamId: z.string().uuid('Team ID must be a valid UUID'),
  position: z.enum([
    'Head Coach',
    'Offensive Coordinator',
    'Defensive Coordinator',
    'Special Teams Coach',
    'Quarterbacks Coach',
    'Running Backs Coach',
    'Wide Receivers Coach',
    'Tight Ends Coach',
    'Offensive Line Coach',
    'Defensive Line Coach',
    'Linebackers Coach',
    'Defensive Backs Coach',
    'Strength and Conditioning Coach',
    'Assistant Coach',
  ]),
});

export type InviteCoachBody = z.infer<typeof inviteCoachBodySchema>;

export const setPasswordBodySchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type SetPasswordBody = z.infer<typeof setPasswordBodySchema>;
