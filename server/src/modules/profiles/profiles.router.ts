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
  (req, res) => {
    const { id } = req.params as { id: string };
    const payload = req.body as PlayerProfileUpdate;

    if (req.user?.id !== id) {
      throw forbidden('Players can only update their own profile');
    }

    return res.json({
      id,
      ...payload,
      updatedAt: new Date().toISOString(),
    });
  },
);

profilesRouter.get('/coaches/:id', validateRequest({ params: profileParamsSchema }), (req, res) => {
  const { id } = req.params as { id: string };

  return res.json({
    id,
    fullName: 'Coach Samantha Lee',
    bio: 'Head coach emphasizing high-tempo offense and disciplined defense.',
    certifications: ['USAF Level 2', 'QB Mechanics Specialist'],
    preferredPositions: ['Quarterback', 'Wide Receiver'],
    teams: [
      { id: 'demo-team-1', name: 'Gridiron Lions', role: 'head-coach' },
      { id: 'demo-team-2', name: 'Gridiron JV Lions', role: 'offensive-coordinator' },
    ],
  });
});

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
