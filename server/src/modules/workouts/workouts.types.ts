import { z } from 'zod';

// Database types
export interface Workout {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  assigned_to_positions: string[] | null;
  difficulty_level: string | null;
  equipment_needed: string[] | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  scheduled_date: string | null;
}

// API Response types
export interface WorkoutListItem {
  id: string;
  name: string;
  durationMinutes: number;
  assignedToPositions: string[] | null;
  scheduledDate: string | null;
}

export interface WorkoutDetail {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  assignedToPositions: string[] | null;
  difficultyLevel: string | null;
  equipmentNeeded: string[] | null;
  createdAt: string;
  updatedAt: string;
  scheduledDate: string | null;
}

export interface WorkoutsResponse {
  teamWorkouts: WorkoutListItem[];
  positionWorkouts: WorkoutListItem[];
}

// Zod schemas for validation
export const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100),
  description: z.string().nullable().optional(),
  durationMinutes: z.number().int().positive('Duration must be a positive number'),
  assignedToPositions: z.array(z.string()).nullable().optional(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).nullable().optional(),
  equipmentNeeded: z.array(z.string()).nullable().optional(),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
});

export const updateWorkoutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  durationMinutes: z.number().int().positive().optional(),
  assignedToPositions: z.array(z.string()).nullable().optional(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).nullable().optional(),
  equipmentNeeded: z.array(z.string()).nullable().optional(),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
});

export type CreateWorkoutDTO = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutDTO = z.infer<typeof updateWorkoutSchema>;
