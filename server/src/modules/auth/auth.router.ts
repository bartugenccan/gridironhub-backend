import { Router } from 'express';
import { validateRequest } from '../../middleware/validate-request';
import { logger } from '../../lib/logger';
import {
  signInWithPassword,
  refreshSession,
  registerPlayer,
  inviteCoach,
  setCoachPassword,
  approveUser,
  setPasswordForUser,
} from './auth.service';
import {
  loginBodySchema,
  refreshBodySchema,
  registerBodySchema,
  inviteCoachBodySchema,
  setPasswordBodySchema,
  approveUserBodySchema,
  type LoginBody,
  type RefreshBody,
  type RegisterBody,
  type InviteCoachBody,
  type SetPasswordBody,
  type ApproveUserBody,
} from './auth.schemas';

import { requireAuth } from '../../middleware/auth-context';
import { supabaseAdmin } from '../../lib/supabase';

export const authRouter = Router();

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = req.user!;
    const metadata = user.metadata ?? {};
    const teamId = typeof metadata.team_id === 'string' ? metadata.team_id.trim() : '';

    let teamName = '';
    if (teamId) {
      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .single();

      if (team) {
        teamName = (team as any).name;
      }
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: typeof metadata.full_name === 'string' ? metadata.full_name : '',
        teamId,
        teamName,
      },
    });
  } catch (error) {
    return next(error);
  }
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

// General set password endpoint (authenticated or for invite flow if user IDs match)
// NOTE: For security, if this is public, it relies on strict logic or token.
// The `setCoachPassword` logic was finding user by email without auth, which is dangerous if public without token.
// The new requirement: "Endpoint to set the password using a token (from the email) or temporary session."
// If using temp session (Bearer token), `requireAuth` middleware handles it.
authRouter.post(
  '/set-password',
  // requireAuth, // We might need this open for invite flow IF logic handles it safely or if using access token in body/headers?
  // If the user clicks the link, they have a session (access_token).
  // Frontend should send Authorization header.
  requireAuth,
  validateRequest({ body: setPasswordBodySchema }),
  async (req, res, next) => {
    const { password } = req.body as SetPasswordBody;
    const user = req.user!;

    try {
      logger.debug({ userId: user.id }, 'Setting password for user');

      await setPasswordForUser(user.id, password);

      return res.status(200).json({
        message: 'Password set successfully',
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
    const { email, password, firstName, lastName, teamId } = req.body as RegisterBody;

    try {
      logger.debug({ email, teamId }, 'Registering new player with team assignment');

      const fullName = `${firstName} ${lastName}`;
      const result = await registerPlayer(email, fullName, teamId, password);

      return res.status(201).json(result);
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

authRouter.post(
  '/approve-user',
  requireAuth,
  validateRequest({ body: approveUserBodySchema }),
  async (req, res, next) => {
    const { userId, action } = req.body as ApproveUserBody;
    const approverId = req.user!.id;

    try {
      logger.debug({ approverId, userId, action }, 'Processing user approval');

      await approveUser(approverId, userId, action);

      return res.status(200).json({
        message: `User ${action}ed successfully`,
      });
    } catch (error) {
      return next(error);
    }
  },
);
