import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth-context';
import { validateRequest } from '../../middleware/validate-request';
import { supabaseAdmin } from '../../lib/supabase';
import { logger } from '../../lib/logger';

export const notificationsRouter = Router();

const registerTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

notificationsRouter.post(
  '/register-token',
  requireAuth,
  validateRequest({ body: registerTokenSchema }),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { token } = req.body;

      // Upsert the token for the user
      const { error } = await supabaseAdmin
        .from('push_tokens')
        .upsert({ user_id: userId, token, updated_at: new Date() }, { onConflict: 'user_id' });

      if (error) {
        logger.error({ error, userId }, 'Failed to register push token');
        throw new Error('Failed to register push token');
      }

      logger.info({ userId }, 'Push token registered successfully');
      return res.status(200).json({ success: true });
    } catch (error) {
      return next(error);
    }
  },
);
