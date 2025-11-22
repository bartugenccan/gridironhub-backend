import { Router } from 'express';
import { getPersonalRecords } from './stats.service';
import { requireAuth } from '../../middleware/auth-context';

export const statsRouter = Router();

statsRouter.get('/personal-records', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const records = await getPersonalRecords(userId);
    return res.json(records);
  } catch (error) {
    return next(error);
  }
});
