import { Router } from 'express';
import { requireAuth } from '../../middleware/auth-context';
import { badRequest } from '../../utils/http-error';
import { getTeamRoster } from './roster.service';

export const rosterRouter = Router();

rosterRouter.use(requireAuth);

/**
 * GET /api/roster
 * Returns all active team members (coaches and players) for the authenticated user's team
 */
rosterRouter.get('/', async (req, res, next) => {
  try {
    const teamId = req.user?.teamId;

    if (!teamId) {
      throw badRequest('User is not assigned to a team');
    }

    const roster = await getTeamRoster(teamId);
    return res.json(roster);
  } catch (error) {
    return next(error);
  }
});
