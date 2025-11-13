import type { Express } from 'express';
import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.router';
import { profilesRouter } from '../modules/profiles/profiles.router';
import { teamsRouter } from '../modules/teams/teams.router';

export const registerRoutes = (app: Express) => {
  const api = Router();

  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  api.use('/auth', authRouter);
  api.use('/profiles', profilesRouter);
  api.use('/teams', teamsRouter);

  app.use('/api', api);
};
