import { z } from 'zod';

export const teamParamsSchema = z.object({
  id: z.string().uuid('Team id must be a valid UUID'),
});

export const teamMembersQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'invited', 'pending']).optional(),
});

export const teamCustomizationSchema = z.object({
  heroTitle: z.string().min(1).max(120).optional(),
  heroMessage: z.string().min(1).max(500).optional(),
  highlightIds: z.array(z.string().uuid()).optional(),
  announcements: z
    .array(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1),
        body: z.string().min(1),
        publishedAt: z.string().datetime(),
      }),
    )
    .optional(),
  resources: z
    .array(
      z.object({
        label: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .optional(),
});

export type TeamCustomizationPayload = z.infer<typeof teamCustomizationSchema>;
