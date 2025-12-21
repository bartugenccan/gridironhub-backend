import type { Express } from 'express';
import { Router } from 'express';
import { attachAuthContext } from '../middleware/auth-context';
import { authRouter } from '../modules/auth/auth.router';
import { profilesRouter } from '../modules/profiles/profiles.router';
import { teamsRouter } from '../modules/teams/teams.router';
import { statsRouter } from '../modules/stats/stats.router';
import { rosterRouter } from '../modules/roster/roster.router';
import { workoutsRouter } from '../modules/workouts/workouts.router';
import { notificationsRouter } from '../modules/notifications/notifications.router';
import { gymRouter } from '../modules/gym/gym.router';

export const registerRoutes = (app: Express) => {
  const api = Router();

  api.use(attachAuthContext);

  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  api.use('/auth', authRouter);
  api.use('/profiles', profilesRouter);
  api.use('/teams', teamsRouter);
  api.use('/stats', statsRouter);
  api.use('/roster', rosterRouter);
  api.use('/workouts', workoutsRouter);
  api.use('/gym', gymRouter);
  api.use('/notifications', notificationsRouter);

  app.use('/api', api);
};
