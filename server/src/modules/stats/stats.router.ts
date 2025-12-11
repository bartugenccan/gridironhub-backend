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
import { upload } from '../../middleware/file-upload';
import { supabaseAdmin } from '../../lib/supabase';
import { uploadFile } from '../../lib/storage';

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

statsRouter.post('/requests', requireAuth, upload.single('video'), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    let videoUrl = req.body.videoUrl;

    // Handle file upload
    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      try {
        videoUrl = await uploadFile('pr-videos', fileName, file);
      } catch (uploadError: any) {
        throw badRequest(uploadError.message);
      }
    }

    // Prepare data for validation (convert strings to numbers if needed)
    const requestData = {
      ...req.body,
      value: Number(req.body.value), // content-type multipart sends numbers as strings
      videoUrl: videoUrl,
    };

    const validation = createPrRequestSchema.safeParse(requestData);

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
