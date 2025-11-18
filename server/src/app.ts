import compression from 'compression';
import cors from 'cors';
import express from 'express';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { logger } from './lib/logger';
import { registerRoutes } from './routes';

export const createApp = () => {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      customProps: () => ({
        service: 'gridironhub-api',
      }),
      autoLogging: env.NODE_ENV !== 'test',
    }),
  );

  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
