import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth-context';
import { validateRequest } from '../../middleware/validate-request';
import { forbidden, notFound } from '../../utils/http-error';
import {
  coachProfileUpdateSchema,
  playerProfileUpdateSchema,
  profileParamsSchema,
  type CoachProfileUpdate,
  type PlayerProfileUpdate,
  type PlayerProfileResponse,
  type CoachProfileResponse,
} from './profiles.schemas';
import { getPlayerPrs } from './profiles.service';
import { supabaseAdmin } from '../../lib/supabase';
import { logger } from '../../lib/logger';

export const profilesRouter = Router();

profilesRouter.use(requireAuth);

profilesRouter.get(
  '/players/:id',
  validateRequest({ params: profileParamsSchema }),
  async (req, res, next) => {
    const { id } = req.params as { id: string };

    try {
      // Fetch player profile from database
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('player_profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if (profileError) {
        logger.error({ error: String(profileError), userId: id }, 'Failed to fetch player profile');
        throw notFound('Player profile not found');
      }

      if (!profile) {
        throw notFound('Player profile not found');
      }

      // Fetch PRs using service function
      const prs = await getPlayerPrs(id);

      // Build response with type assertions for database row
      const profileRow = profile as {
        user_id: string;
        full_name: string | null;
        jersey_number: number | null;
        position: string | null;
        dominant_hand: string | null;
        height_cm: number | null;
        weight_kg: number | null;
        bio: string | null;
      };

      const response: PlayerProfileResponse = {
        id: profileRow.user_id,
        fullName: profileRow.full_name ?? null,
        jerseyNumber: profileRow.jersey_number ?? null,
        position: profileRow.position ?? null,
        dominantHand: profileRow.dominant_hand ?? null,
        heightCm: profileRow.height_cm ? Number(profileRow.height_cm) : null,
        weightKg: profileRow.weight_kg ? Number(profileRow.weight_kg) : null,
        bio: profileRow.bio ?? null,
        prs,
      };

      return res.json(response);
    } catch (error) {
      return next(error);
    }
  },
);

profilesRouter.patch(
  '/players/:id',
  requireRole('player'),
  validateRequest({ params: profileParamsSchema, body: playerProfileUpdateSchema }),
  async (req, res, next) => {
    const { id } = req.params as { id: string };
    const payload = req.body as PlayerProfileUpdate;

    if (req.user?.id !== id) {
      throw forbidden('Players can only update their own profile');
    }

    try {
      // Build update object with snake_case for database
      const updateData: Record<string, unknown> = {};

      if (payload.fullName !== undefined) updateData.full_name = payload.fullName;
      if (payload.jerseyNumber !== undefined) updateData.jersey_number = payload.jerseyNumber;
      if (payload.position !== undefined) updateData.position = payload.position;
      if (payload.dominantHand !== undefined) updateData.dominant_hand = payload.dominantHand;
      if (payload.heightCm !== undefined) updateData.height_cm = payload.heightCm;
      if (payload.weightKg !== undefined) updateData.weight_kg = payload.weightKg;
      if (payload.bio !== undefined) updateData.bio = payload.bio;

      // Update player profile in database
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('player_profiles')
        .update(updateData)
        .eq('user_id', id)
        .select()
        .single();

      if (updateError) {
        logger.error({ error: String(updateError), userId: id }, 'Failed to update player profile');
        throw new Error('Failed to update player profile');
      }

      return res.json({
        id,
        ...payload,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      return next(error);
    }
  },
);

profilesRouter.get(
  '/coaches/:id',
  validateRequest({ params: profileParamsSchema }),
  async (req, res, next) => {
    const { id } = req.params as { id: string };

    try {
      const { data: coachProfile, error: profileError } = await supabaseAdmin
        .from('coach_profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if (profileError) {
        logger.error({ error: String(profileError), userId: id }, 'Failed to fetch coach profile');
        throw notFound('Coach profile not found');
      }

      if (!coachProfile) {
        throw notFound('Coach profile not found');
      }

      const profileRow = coachProfile as {
        user_id: string;
        full_name: string | null;
        bio: string | null;
        certifications: string[] | null;
        preferred_positions: string[] | null;
      };

      const response: CoachProfileResponse = {
        id: profileRow.user_id,
        fullName: profileRow.full_name ?? null,
        bio: profileRow.bio ?? null,
        certifications: profileRow.certifications ?? [],
        preferredPositions: profileRow.preferred_positions ?? [],
      };

      return res.json(response);
    } catch (error) {
      return next(error);
    }
  },
);

profilesRouter.patch(
  '/coaches/:id',
  requireRole('coach'),
  validateRequest({ params: profileParamsSchema, body: coachProfileUpdateSchema }),
  (req, res) => {
    const { id } = req.params as { id: string };
    const payload = req.body as CoachProfileUpdate;

    if (req.user?.id !== id) {
      throw forbidden('Coaches can only update their own profile');
    }

    return res.json({
      id,
      ...payload,
      updatedAt: new Date().toISOString(),
    });
  },
);
