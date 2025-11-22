import { Router } from 'express';
import {
  addStrengthLog,
  deleteStrengthLog,
  getLiftHistory,
  getPersonalRecords,
} from './stats.service';
import { createStrengthLogSchema } from './stats.types';
import { badRequest } from '../../utils/http-error';
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

statsRouter.post('/personal-records', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const validatedData = createStrengthLogSchema.parse(req.body);
    const newLog = await addStrengthLog(userId, validatedData);
    return res.status(201).json(newLog);
  } catch (error) {
    return next(error);
  }
});

statsRouter.delete('/personal-records/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      throw badRequest('Record ID is required');
    }

    await deleteStrengthLog(userId, id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

statsRouter.get('/personal-records/history', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { liftName } = req.query;

    if (!liftName || typeof liftName !== 'string') {
      throw badRequest('liftName query parameter is required');
    }

    const history = await getLiftHistory(userId, liftName);
    return res.json(history);
  } catch (error) {
    return next(error);
  }
});
