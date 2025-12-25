import { Router } from 'express';
import { z } from 'zod';
import { createCheckin, getUserCheckins, getTeamCheckins } from './gym.service';
import { requireAuth } from '../../middleware/auth-context';
import { badRequest, forbidden } from '../../utils/http-error';

export const gymRouter = Router();

// Validation schemas
const createCheckinSchema = z.object({
  checkinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

gymRouter.use(requireAuth);

// Check-in
gymRouter.post('/checkin', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const teamId = req.user?.teamId;

    if (!userId || !teamId) {
      throw badRequest('User not authenticated or not in a team');
    }

    const { checkinDate } = createCheckinSchema.parse(req.body);

    const checkin = await createCheckin(userId, teamId, { checkinDate });

    res.status(201).json({
      message: 'Gym check-in successful',
      checkin,
    });
  } catch (error) {
    next(error);
  }
});

// Get My History
gymRouter.get('/history', async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw badRequest('User not authenticated');
    }

    const checkins = await getUserCheckins(userId);

    res.json({
      checkins,
    });
  } catch (error) {
    next(error);
  }
});

// Get Team History (Coach Only)
gymRouter.get('/team-history', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const teamId = req.user?.teamId;
    const role = req.user?.role;

    if (!userId || !teamId) {
      throw badRequest('User not authenticated or not in a team');
    }

    if (role !== 'coach') {
      throw forbidden('Only coaches can view team history');
    }

    const checkins = await getTeamCheckins(teamId);

    res.json({
      checkins,
    });
  } catch (error) {
    next(error);
  }
});
