import { z } from 'zod';

export const rosterMemberSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  role: z.enum(['coach', 'player']),
});

export const playerRosterMemberSchema = rosterMemberSchema.extend({
  role: z.literal('player'),
  jerseyNumber: z.number().int().nullable(),
  position: z.string().nullable(),
});

export const coachRosterMemberSchema = rosterMemberSchema.extend({
  role: z.literal('coach'),
  primaryPosition: z.string().nullable(),
});

export const rosterResponseSchema = z.object({
  teamId: z.string().uuid(),
  coaches: z.array(coachRosterMemberSchema),
  players: z.array(playerRosterMemberSchema),
});

export type RosterResponse = z.infer<typeof rosterResponseSchema>;
