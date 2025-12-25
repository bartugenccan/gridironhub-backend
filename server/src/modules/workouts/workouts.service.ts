import { supabaseAdmin } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { badRequest, notFound } from '../../utils/http-error';
import type {
  Workout,
  WorkoutsResponse,
  WorkoutDetail,
  CreateWorkoutDTO,
  UpdateWorkoutDTO,
} from './workouts.types';

/**
 * Fetches all active workouts for a user's team, filtered by their position
 * @param teamId - The UUID of the team
 * @param userPosition - The user's position (e.g., 'QB', 'WR')
 * @returns WorkoutsResponse containing team workouts and position-specific workouts
 */
type GetWorkoutsOptions = {
  includeAllPositions?: boolean;
};

export const getWorkoutsForUser = async (
  teamId: string,
  userPosition: string | null,
  options: GetWorkoutsOptions = {},
): Promise<WorkoutsResponse> => {
  try {
    // Fetch all active workouts for the team
    const { data: workouts, error } = await supabaseAdmin
      .from('workouts')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error({ error, teamId }, 'Failed to fetch workouts');
      throw badRequest(`Failed to fetch workouts: ${error.message}`);
    }

    if (!workouts || workouts.length === 0) {
      return {
        teamWorkouts: [],
        positionWorkouts: [],
      };
    }

    const teamWorkouts: WorkoutsResponse['teamWorkouts'] = [];
    const positionWorkouts: WorkoutsResponse['positionWorkouts'] = [];

    (workouts as unknown as Workout[]).forEach((workout) => {
      const workoutItem = {
        id: workout.id,
        name: workout.name,
        durationMinutes: workout.duration_minutes,
        assignedToPositions: workout.assigned_to_positions,
        scheduledDate: workout.scheduled_date,
      };

      // Team workout: no positions assigned or empty array
      if (!workout.assigned_to_positions || workout.assigned_to_positions.length === 0) {
        teamWorkouts.push(workoutItem);
      }
      // Position-specific workouts: include all for coaches or match player position
      else if (
        options.includeAllPositions ||
        (userPosition && workout.assigned_to_positions.includes(userPosition))
      ) {
        positionWorkouts.push(workoutItem);
      }
    });

    return {
      teamWorkouts,
      positionWorkouts,
    };
  } catch (error) {
    logger.error({ error, teamId, userPosition }, 'Error fetching workouts for user');
    throw error;
  }
};

/**
 * Fetches detailed information for a specific workout
 * @param workoutId - The UUID of the workout
 * @param teamId - The UUID of the team (for authorization)
 * @returns WorkoutDetail object
 */
export const getWorkoutById = async (workoutId: string, teamId: string): Promise<WorkoutDetail> => {
  try {
    const { data: workout, error } = await supabaseAdmin
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (error || !workout) {
      logger.error({ error, workoutId, teamId }, 'Workout not found');
      throw notFound('Workout not found');
    }

    const workoutData = workout as unknown as Workout;

    return {
      id: workoutData.id,
      name: workoutData.name,
      description: workoutData.description,
      durationMinutes: workoutData.duration_minutes,
      assignedToPositions: workoutData.assigned_to_positions,
      difficultyLevel: workoutData.difficulty_level,
      equipmentNeeded: workoutData.equipment_needed,
      createdAt: workoutData.created_at,
      updatedAt: workoutData.updated_at,
      scheduledDate: workoutData.scheduled_date,
      youtubeUrl: workoutData.youtube_url,
    };
  } catch (error) {
    logger.error({ error, workoutId, teamId }, 'Error fetching workout by ID');
    throw error;
  }
};

/**
 * Creates a new workout
 * @param teamId - The UUID of the team
 * @param createdBy - The UUID of the user creating the workout
 * @param data - The workout data
 * @returns The created workout
 */
export const createWorkout = async (
  teamId: string,
  createdBy: string,
  data: CreateWorkoutDTO,
): Promise<WorkoutDetail> => {
  try {
    const { data: newWorkout, error } = await supabaseAdmin
      .from('workouts')
      .insert({
        team_id: teamId,
        name: data.name,
        description: data.description,
        duration_minutes: data.durationMinutes,
        assigned_to_positions: data.assignedToPositions || null,
        difficulty_level: data.difficultyLevel || null,
        equipment_needed: data.equipmentNeeded || null,
        scheduled_date: data.scheduledDate || null,
        created_by: createdBy,
        is_active: true,
        youtube_url: data.youtubeUrl || null,
      })
      .select()
      .single();

    if (error) {
      logger.error({ error, teamId, createdBy }, 'Failed to create workout');
      throw badRequest(`Failed to create workout: ${error.message}`);
    }

    const workoutData = newWorkout as unknown as Workout;

    return {
      id: workoutData.id,
      name: workoutData.name,
      description: workoutData.description,
      durationMinutes: workoutData.duration_minutes,
      assignedToPositions: workoutData.assigned_to_positions,
      difficultyLevel: workoutData.difficulty_level,
      equipmentNeeded: workoutData.equipment_needed,
      createdAt: workoutData.created_at,
      updatedAt: workoutData.updated_at,
      scheduledDate: workoutData.scheduled_date,
      youtubeUrl: workoutData.youtube_url,
    };
  } catch (error) {
    logger.error({ error, teamId, createdBy }, 'Error creating workout');
    throw error;
  }
};

/**
 * Updates an existing workout
 * @param workoutId - The UUID of the workout
 * @param teamId - The UUID of the team (for authorization)
 * @param data - The updated workout data
 * @returns The updated workout
 */
export const updateWorkout = async (
  workoutId: string,
  teamId: string,
  data: UpdateWorkoutDTO,
): Promise<WorkoutDetail> => {
  try {
    // First verify the workout exists and belongs to the team
    const { data: existingWorkout, error: fetchError } = await supabaseAdmin
      .from('workouts')
      .select('id')
      .eq('id', workoutId)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (fetchError || !existingWorkout) {
      throw notFound('Workout not found or access denied');
    }

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.durationMinutes !== undefined) updateData.duration_minutes = data.durationMinutes;
    if (data.assignedToPositions !== undefined)
      updateData.assigned_to_positions = data.assignedToPositions;
    if (data.difficultyLevel !== undefined) updateData.difficulty_level = data.difficultyLevel;
    if (data.equipmentNeeded !== undefined) updateData.equipment_needed = data.equipmentNeeded;
    if (data.scheduledDate !== undefined) updateData.scheduled_date = data.scheduledDate;
    if (data.youtubeUrl !== undefined) updateData.youtube_url = data.youtubeUrl;

    const { data: updatedWorkout, error } = await supabaseAdmin
      .from('workouts')
      .update(updateData)
      .eq('id', workoutId)
      .select()
      .single();

    if (error) {
      logger.error({ error, workoutId, teamId }, 'Failed to update workout');
      throw badRequest(`Failed to update workout: ${error.message}`);
    }

    const workoutData = updatedWorkout as unknown as Workout;

    return {
      id: workoutData.id,
      name: workoutData.name,
      description: workoutData.description,
      durationMinutes: workoutData.duration_minutes,
      assignedToPositions: workoutData.assigned_to_positions,
      difficultyLevel: workoutData.difficulty_level,
      equipmentNeeded: workoutData.equipment_needed,
      createdAt: workoutData.created_at,
      updatedAt: workoutData.updated_at,
      scheduledDate: workoutData.scheduled_date,
      youtubeUrl: workoutData.youtube_url,
    };
  } catch (error) {
    logger.error({ error, workoutId, teamId }, 'Error updating workout');
    throw error;
  }
};

/**
 * Soft deletes a workout
 * @param workoutId - The UUID of the workout
 * @param teamId - The UUID of the team (for authorization)
 */
export const deleteWorkout = async (workoutId: string, teamId: string): Promise<void> => {
  try {
    // First verify the workout exists and belongs to the team
    const { data: existingWorkout, error: fetchError } = await supabaseAdmin
      .from('workouts')
      .select('id')
      .eq('id', workoutId)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (fetchError || !existingWorkout) {
      throw notFound('Workout not found or access denied');
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from('workouts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', workoutId);

    if (error) {
      logger.error({ error, workoutId, teamId }, 'Failed to delete workout');
      throw badRequest(`Failed to delete workout: ${error.message}`);
    }
  } catch (error) {
    logger.error({ error, workoutId, teamId }, 'Error deleting workout');
    throw error;
  }
};
