import pino from 'pino';
import { env, isProduction } from '../config/env';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          singleLine: false,
        },
      },
  base: {
    service: 'gridironhub-api',
    environment: env.NODE_ENV,
  },
});
