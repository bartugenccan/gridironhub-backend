import type { Session, User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../lib/supabase';
import { badRequest, forbidden, unauthorized } from '../../utils/http-error';
import type { AuthResponse, SessionPayload, UserRole } from './auth.types';

const mapRole = (user: User): UserRole => {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const roleValue = metadata['role'];
  if (roleValue === 'coach' || roleValue === 'player') {
    return roleValue;
  }
  throw forbidden('User role is missing or invalid');
};

const mapSession = (session: Session): SessionPayload => ({
  accessToken: session.access_token,
  refreshToken: session.refresh_token ?? '',
  expiresIn: session.expires_in ?? 3600,
  tokenType: session.token_type ?? 'bearer',
});

const mapUser = (user: User) => ({
  id: user.id,
  email: user.email ?? '',
  role: mapRole(user),
  metadata: (user.user_metadata ?? {}) as Record<string, unknown>,
});

export const signInWithPassword = async (
  email: string,
  password: string,
  expectedRole: UserRole,
): Promise<AuthResponse> => {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    throw unauthorized('Invalid credentials');
  }

  const user = mapUser(data.user);

  if (user.role !== expectedRole) {
    throw forbidden('Role mismatch for this account');
  }

  return {
    session: mapSession(data.session),
    user,
  };
};

export const refreshSession = async (refreshToken: string): Promise<SessionPayload> => {
  if (!refreshToken) {
    throw badRequest('Refresh token is required');
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    throw unauthorized('Refresh token is invalid or expired');
  }

  return mapSession(data.session);
};
