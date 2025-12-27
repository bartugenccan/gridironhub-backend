import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

type KnownError = Error & {
  status?: number;
  statusCode?: number;
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    const flattened = err.flatten();
    return res.status(400).json({
      message: 'Validation error',
      errors: flattened.fieldErrors,
    });
  }

  const error = err as KnownError;
  const statusCandidate = error.status ?? error.statusCode ?? 500;
  const isValidStatus =
    typeof statusCandidate === 'number' &&
    Number.isFinite(statusCandidate) &&
    statusCandidate >= 400 &&
    statusCandidate < 600;
  const status = isValidStatus ? statusCandidate : 500;

  logger.error(
    {
      err: error, // Ensure 'err' key is used for some loggers to serialize Error objects
      error,
      path: req.originalUrl,
      method: req.method,
      status,
    },
    'Unhandled error processing request',
  );

  // Fallback console log to ensure we see it if logger fails or is filtered
  if (status === 500) {
    console.error('CRITICAL 500 ERROR:', error);
  }

  if (res.headersSent) {
    return next(error);
  }

  return res.status(status).json({
    message: error.message && error.message.length > 0 ? error.message : 'Internal server error',
  });
};
