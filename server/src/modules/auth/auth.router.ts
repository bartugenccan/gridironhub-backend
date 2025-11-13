import { Router } from 'express';
import { validateRequest } from '../../middleware/validate-request';
import { logger } from '../../lib/logger';
import { signInWithPassword, refreshSession } from './auth.service';
import {
  loginBodySchema,
  refreshBodySchema,
  type LoginBody,
  type RefreshBody,
} from './auth.schemas';

export const authRouter = Router();

authRouter.post('/login', validateRequest({ body: loginBodySchema }), async (req, res, next) => {
  const { email, password, role } = req.body as LoginBody;

  try {
    logger.debug({ email, role }, 'Authenticating user with Supabase');

    const authResponse = await signInWithPassword(email, password, role);

    return res.status(200).json(authResponse);
  } catch (error) {
    return next(error);
  }
});

authRouter.post(
  '/refresh',
  validateRequest({ body: refreshBodySchema }),
  async (req, res, next) => {
    const { refreshToken } = req.body as RefreshBody;

    try {
      const session = await refreshSession(refreshToken);
      return res.status(200).json({ session });
    } catch (error) {
      return next(error);
    }
  },
);

authRouter.post('/logout', (_req, res) => {
  // With Supabase, clients invalidate tokens locally. Endpoint kept for parity with clients.
  return res.status(204).send();
});
