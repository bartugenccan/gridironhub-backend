import type { RequestHandler } from 'express';
import { getUserFromAccessToken } from '../lib/supabase';
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
    const { client, user } = await getUserFromAccessToken(token);
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const roleValue = metadata['role'];

    if (roleValue !== 'coach' && roleValue !== 'player') {
      throw unauthorized('User role is invalid');
    }

    req.user = {
      id: user.id,
      email: user.email ?? '',
      role: roleValue,
      metadata,
    };

    req.supabase = client;

    return next();
  } catch (error) {
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
