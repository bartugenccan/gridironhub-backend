import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { createSupabaseClient } from '../lib/supabase';
import { unauthorized } from '../utils/http-error';
import type { UserRole } from '../modules/auth/auth.types';

const extractToken = (authorizationHeader?: string | string[]) => {
  if (!authorizationHeader) {
    return undefined;
  }
  const value = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader;
  const [scheme, token] = value.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return undefined;
  }
  return token;
};

export const attachAuthContext: RequestHandler = async (req, _res, next) => {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    return next();
  }

  try {
    // Verify token locally
    const payload = jwt.verify(token, env.SUPABASE_JWT_SECRET) as jwt.JwtPayload;

    const metadata = (payload.user_metadata ?? {}) as Record<string, unknown>;
    const roleValue = metadata['role'];

    if (roleValue !== 'coach' && roleValue !== 'player') {
      throw unauthorized('User role is invalid');
    }

    req.user = {
      id: payload.sub as string,
      email: payload.email as string,
      role: roleValue as UserRole,
      teamId: typeof metadata.team_id === 'string' ? metadata.team_id.trim() : undefined,
      metadata,
    };

    req.supabase = createSupabaseClient(token);

    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(unauthorized('Token expired'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(unauthorized('Invalid token'));
    }
    return next(error);
  }
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    return next(unauthorized());
  }
  return next();
};

export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      return next(unauthorized());
    }

    if (!roles.includes(req.user.role)) {
      return next(unauthorized('Insufficient permissions'));
    }

    return next();
  };
