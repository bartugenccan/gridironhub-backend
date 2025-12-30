import { Router } from 'express';
import {
  addStrengthLog,
  deleteStrengthLog,
  getLiftHistory,
  getPersonalRecords,
  createPrRequest,
  getPendingPrRequests,
  updatePrRequestStatus,
} from './stats.service';
import {
  createStrengthLogSchema,
  createPrRequestSchema,
  updatePrRequestStatusSchema,
} from './stats.types';
import { badRequest } from '../../utils/http-error';
import { requireAuth } from '../../middleware/auth-context';
import { supabaseAdmin } from '../../lib/supabase';

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

// Removed 'upload' middleware and file handling logic to support client-side uploads (avoiding Vercel 4.5MB limit)
statsRouter.post('/requests', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Use safeParse directly on req.body since we expect JSON now
    const validation = createPrRequestSchema.safeParse(req.body);

    if (!validation.success) {
      throw badRequest(validation.error.message);
    }

    const result = await createPrRequest(userId, validation.data);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
});

statsRouter.get('/requests', requireAuth, async (req, res, next) => {
  try {
    // TODO: Add role check here (only coach/admin should see this)
    const result = await getPendingPrRequests();
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

statsRouter.patch('/requests/:id', requireAuth, async (req, res, next) => {
  try {
    // TODO: Add role check here (only coach/admin should can approve/reject)
    const validation = updatePrRequestStatusSchema.safeParse(req.body);

    if (!validation.success) {
      throw badRequest(validation.error.message);
    }

    const result = await updatePrRequestStatus(req.params.id, validation.data);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});
