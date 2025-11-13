import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth-context';
import { validateRequest } from '../../middleware/validate-request';
import { forbidden } from '../../utils/http-error';
import {
  coachProfileUpdateSchema,
  playerProfileUpdateSchema,
  profileParamsSchema,
  type CoachProfileUpdate,
  type PlayerProfileUpdate,
} from './profiles.schemas';

export const profilesRouter = Router();

profilesRouter.use(requireAuth);

profilesRouter.get('/players/:id', validateRequest({ params: profileParamsSchema }), (req, res) => {
  const { id } = req.params as { id: string };

  return res.json({
    id,
    fullName: 'Jordan Edwards',
    jerseyNumber: 12,
    position: 'Quarterback',
    dominantHand: 'right',
    heightCm: 190,
    weightKg: 92,
    teamId: 'demo-team-1',
    bio: 'Senior QB leading the offense with a focus on timing routes.',
    strength: {
      benchPressKg: 125,
      squatKg: 165,
      deadliftKg: 185,
    },
    metrics: [
      { recordedAt: '2025-08-01', heightCm: 190, weightKg: 92 },
      { recordedAt: '2025-05-01', heightCm: 190, weightKg: 90 },
    ],
  });
});

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
