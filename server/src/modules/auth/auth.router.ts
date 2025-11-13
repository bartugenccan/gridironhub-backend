import { Router } from 'express';
import { validateRequest } from '../../middleware/validate-request';
import { logger } from '../../lib/logger';
import {
  loginBodySchema,
  refreshBodySchema,
  type LoginBody,
  type RefreshBody,
} from './auth.schemas';

export const authRouter = Router();

authRouter.post('/login', validateRequest({ body: loginBodySchema }), (req, res) => {
  const { email, role } = req.body as LoginBody;

  logger.debug({ email, role }, 'Authenticating user');

  // This is a placeholder implementation while Supabase Auth is wired.
  // The final integration will exchange credentials for a Supabase session.
  const mockUser = {
    id: '00000000-0000-0000-0000-000000000000',
    email,
    role,
    teams: role === 'coach' ? ['demo-team-1'] : ['demo-team-1', 'demo-team-2'],
  };

  return res.status(200).json({
    session: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    },
    user: mockUser,
  });
});

authRouter.post('/refresh', validateRequest({ body: refreshBodySchema }), (req, res) => {
  const { refreshToken } = req.body as RefreshBody;

  logger.debug({ refreshToken }, 'Refreshing session');

  // Placeholder response until Supabase token refresh is implemented.
  return res.status(200).json({
    session: {
      accessToken: 'mock-access-token-refreshed',
      refreshToken,
      expiresIn: 3600,
    },
  });
});

authRouter.post('/logout', (_req, res) => {
  // With Supabase, clients invalidate tokens locally. Endpoint kept for parity with clients.
  return res.status(204).send();
});
