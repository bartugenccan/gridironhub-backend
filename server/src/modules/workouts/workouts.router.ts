import { Router } from 'express';
import { requireAuth } from '../../middleware/auth-context';
import { badRequest } from '../../utils/http-error';
import {
  getWorkoutsForUser,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} from './workouts.service';
import { createWorkoutSchema, updateWorkoutSchema } from './workouts.types';
import { supabaseAdmin } from '../../lib/supabase';
import { logger } from '../../lib/logger';

export const workoutsRouter = Router();

workoutsRouter.use(requireAuth);

/**
 * GET /api/workouts
 * Returns all active workouts for the authenticated user's team,
 * filtered by their position and grouped into team vs position-specific workouts
 */
workoutsRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const teamId = req.user?.teamId;
    const isCoach = req.user?.role === 'coach';

    if (!teamId) {
      throw badRequest('User is not assigned to a team');
    }

    let userPosition: string | string[] | null = null;
    if (!isCoach) {
      // Fetch player's position from player_profiles first, fallback to team_members
      const [teamMemberResult, playerProfileResult] = await Promise.all([
        supabaseAdmin
          .from('team_members')
          .select('primary_position')
          .eq('user_id', userId)
          .eq('team_id', teamId)
          .single(),
        supabaseAdmin.from('player_profiles').select('position').eq('user_id', userId).single(),
      ]);

      if (teamMemberResult.error) {
        throw badRequest('Failed to fetch user team information');
      }

      // Prioritize player_profile position, fallback to team_member primary_position
      userPosition =
        playerProfileResult.data?.position || teamMemberResult.data?.primary_position || null;
    }

    logger.info({ userId, teamId, userPosition }, 'Fetching workouts for user');

    const workouts = await getWorkoutsForUser(teamId, userPosition, {
      includeAllPositions: isCoach,
    });

    return res.json(workouts);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/workouts/:id
 * Returns detailed information for a specific workout
 */
workoutsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const teamId = req.user?.teamId;

    if (!teamId) {
      throw badRequest('User is not assigned to a team');
    }

    if (!id) {
      throw badRequest('Workout ID is required');
    }

    const workout = await getWorkoutById(id, teamId);
    return res.json(workout);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/workouts
 * Creates a new workout (coach only)
 */
workoutsRouter.post('/', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const teamId = req.user?.teamId;

    if (!teamId) {
      throw badRequest('User is not assigned to a team');
    }

    // Validate request body
    const validatedData = createWorkoutSchema.parse(req.body);

    const newWorkout = await createWorkout(teamId, userId!, validatedData);
    return res.status(201).json(newWorkout);
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/workouts/:id
 * Updates an existing workout (coach only)
 */
workoutsRouter.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const teamId = req.user?.teamId;

    if (!teamId) {
      throw badRequest('User is not assigned to a team');
    }

    if (!id) {
      throw badRequest('Workout ID is required');
    }

    // Validate request body
    const validatedData = updateWorkoutSchema.parse(req.body);

    const updatedWorkout = await updateWorkout(id, teamId, validatedData);
    return res.json(updatedWorkout);
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/workouts/:id
 * Soft deletes a workout (coach only)
 */
workoutsRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const teamId = req.user?.teamId;

    if (!teamId) {
      throw badRequest('User is not assigned to a team');
    }

    if (!id) {
      throw badRequest('Workout ID is required');
    }

    await deleteWorkout(id, teamId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});
