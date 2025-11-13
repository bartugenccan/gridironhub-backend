import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';

const app = createApp();

app
  .listen(env.PORT, () => {
    logger.info(`🚀 GridironHub API listening on port ${env.PORT}`);
  })
  .on('error', (error) => {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  });
