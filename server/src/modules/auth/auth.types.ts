export type UserRole = 'coach' | 'player';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  metadata: Record<string, unknown>;
}

export interface SessionPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthResponse {
  session: SessionPayload;
  user: AuthenticatedUser;
}
