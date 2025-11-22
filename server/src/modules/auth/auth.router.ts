import { Router } from 'express';
import { validateRequest } from '../../middleware/validate-request';
import { logger } from '../../lib/logger';
import {
  signInWithPassword,
  refreshSession,
  registerPlayer,
  inviteCoach,
  setCoachPassword,
} from './auth.service';
import {
  loginBodySchema,
  refreshBodySchema,
  registerBodySchema,
  inviteCoachBodySchema,
  setPasswordBodySchema,
  type LoginBody,
  type RefreshBody,
  type RegisterBody,
  type InviteCoachBody,
  type SetPasswordBody,
} from './auth.schemas';

import { requireAuth } from '../../middleware/auth-context';

export const authRouter = Router();

authRouter.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({ user: req.user });
});

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

// Invitation callback handler for testing (backend only)
// In production, this should be handled by frontend
authRouter.get('/invite-callback', (req, res) => {
  const { access_token, refresh_token, type, error, error_description } = req.query;

  if (error) {
    return res.status(400).json({
      error,
      error_description,
      message: 'Invitation failed',
    });
  }

  if (type === 'invite' && access_token) {
    // Return invitation acceptance info
    // Frontend would use these tokens to set password
    return res.json({
      message: 'Invitation link received',
      type: 'invite',
      access_token: access_token as string,
      refresh_token: refresh_token as string,
      note: 'This is a test endpoint. In production, frontend handles invitation acceptance.',
      instructions: [
        '1. Copy the access_token and refresh_token',
        '2. Use POST /api/auth/set-password endpoint to set password for the user',
        '3. Database triggers will automatically create profile and team assignment',
        '4. After password is set, user can login normally',
      ],
    });
  }

  return res.status(400).json({
    message: 'Invalid invitation callback',
  });
});

// Test endpoint to set password for invited coach (backend testing only)
authRouter.post(
  '/set-password',
  validateRequest({ body: setPasswordBodySchema }),
  async (req, res, next) => {
    const { email, password } = req.body as SetPasswordBody;

    try {
      logger.debug({ email }, 'Setting password for invited coach');

      await setCoachPassword(email, password);

      return res.status(200).json({
        message: 'Password set successfully',
        email,
        note: 'Database triggers will automatically create profile and team assignment',
      });
    } catch (error) {
      return next(error);
    }
  },
);

authRouter.post(
  '/register',
  validateRequest({ body: registerBodySchema }),
  async (req, res, next) => {
    const { email, password, fullName, teamId } = req.body as RegisterBody;

    try {
      logger.debug({ email, teamId }, 'Registering new player with team assignment');

      const authResponse = await registerPlayer(email, password, fullName, teamId);

      return res.status(201).json(authResponse);
    } catch (error) {
      return next(error);
    }
  },
);

authRouter.post(
  '/invite-coach',
  validateRequest({ body: inviteCoachBodySchema }),
  async (req, res, next) => {
    const { email, fullName, teamId, position } = req.body as InviteCoachBody;

    try {
      logger.debug({ email, teamId, position }, 'Inviting coach with team assignment');

      await inviteCoach(email, fullName, teamId, position);

      return res.status(200).json({
        message: 'Coach invitation sent successfully',
        email,
        teamId,
        position,
      });
    } catch (error) {
      return next(error);
    }
  },
);
