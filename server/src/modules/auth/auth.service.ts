import { createClient, type Session, type User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../lib/supabase';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { badRequest, forbidden, unauthorized } from '../../utils/http-error';
import type { AuthResponse, SessionPayload, UserRole, AuthenticatedUser } from './auth.types';
import type { Database } from '../../types/supabase';
import { PlayerPosition } from './auth.schemas';

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

const mapUser = (user: User, teamName: string): AuthenticatedUser => {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    email: user.email ?? '',
    role: mapRole(user),
    fullName: typeof metadata.full_name === 'string' ? metadata.full_name : '',
    teamId: typeof metadata.team_id === 'string' ? metadata.team_id.trim() : '',
    teamName,
  };
};

export const signInWithPassword = async (
  email: string,
  password: string,
  expectedRole: UserRole,
): Promise<AuthResponse> => {
  const authClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const { data, error } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    throw unauthorized('Invalid credentials');
  }

  const metadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const teamId = typeof metadata.team_id === 'string' ? metadata.team_id.trim() : '';

  let teamName = '';
  if (teamId) {
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('name')
      .eq('id', teamId)
      .single();

    if (team) {
      teamName = (team as any).name;
    }
  }

  const user = mapUser(data.user, teamName);

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

export const registerPlayer = async (
  email: string,
  password: string,
  fullName: string,
  teamId: string,
): Promise<AuthResponse> => {
  // Validate team exists
  const { data: team, error: teamError } = await supabaseAdmin
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .single();

  if (teamError || !team) {
    throw badRequest('Team not found');
  }

  // Create user with role: player in metadata, including team_id
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'player',
      full_name: fullName,
      team_id: teamId,
    },
  });

  if (createError || !createData.user) {
    if (createError?.message.includes('already registered')) {
      throw badRequest('Email is already registered');
    }
    throw badRequest(createError?.message ?? 'Failed to create user');
  }

  const userId = createData.user.id;

  // Insert or update player profile
  // Note: Trigger creates the profile automatically
  // Use upsert to handle both cases (trigger created it or not)
  const { error: profileError } = await supabaseAdmin.from('player_profiles').upsert(
    {
      user_id: userId,
      full_name: fullName,
    } as Database['public']['Tables']['player_profiles']['Insert'],
    {
      onConflict: 'user_id',
    },
  );

  if (profileError) {
    // Cleanup: delete user if profile creation fails
    await supabaseAdmin.auth.admin.deleteUser(userId);
    logger.error({ error: profileError, userId }, 'Failed to create/update player profile');
    throw badRequest(`Failed to create player profile: ${profileError.message}`);
  }

  // Assign player to team
  const { error: assignmentError } = await supabaseAdmin.from('team_members').insert({
    team_id: teamId,
    user_id: userId,
    role: 'player',
    status: 'active',
  } as Database['public']['Tables']['team_members']['Insert']);

  if (assignmentError) {
    // Log error but don't fail registration - trigger might also handle it
    logger.error(
      { error: assignmentError, userId, teamId },
      'Failed to assign player to team during registration',
    );
  }

  // Sign in to get session
  const authClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.session || !signInData.user) {
    throw unauthorized('Failed to create session after registration');
  }

  return {
    session: mapSession(signInData.session),
    user: mapUser(signInData.user, (team as any).name),
  };
};

export const inviteCoach = async (
  email: string,
  fullName: string,
  teamId: string,
  position: string,
): Promise<void> => {
  // Validate team exists
  const { data: team, error: teamError } = await supabaseAdmin
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .maybeSingle();

  if (teamError || !team) {
    throw badRequest('Team not found');
  }

  // Send invitation with team_id and position in metadata
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      role: 'coach',
      full_name: fullName,
      team_id: teamId,
      position: position,
    },
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      throw badRequest('Email is already registered');
    }
    throw badRequest(error.message ?? 'Failed to send coach invitation');
  }

  // Note: Profile and team assignment happens automatically via database triggers
  // when coach accepts invitation and sets password.
  // See docs/sql/0003_profile_triggers.sql and docs/sql/0005_team_assignment_trigger.sql
  // If user was created immediately (already had an account), create profile and assign to team now
  if (data?.user?.id) {
    const userId = data.user.id;

    // Update user metadata if not set correctly
    const currentMetadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
    if (currentMetadata.role !== 'coach' || currentMetadata.team_id !== teamId) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...currentMetadata,
          role: 'coach',
          full_name: fullName,
          team_id: teamId,
          position: position,
        },
      });
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('coach_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (!existingProfile) {
      // Create coach profile if it doesn't exist
      const { error: profileError } = await supabaseAdmin.from('coach_profiles').insert({
        user_id: userId,
        full_name: fullName,
      } as Database['public']['Tables']['coach_profiles']['Insert']);

      if (profileError) {
        logger.error(
          { error: profileError, userId },
          'Failed to create coach profile after invitation',
        );
      }
    }

    // Check if team assignment already exists
    const { data: existingAssignment } = await supabaseAdmin
      .from('team_members')
      .select('team_id, user_id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (!existingAssignment) {
      // Assign coach to team
      const { error: assignmentError } = await supabaseAdmin.from('team_members').insert({
        team_id: teamId,
        user_id: userId,
        role: 'coach',
        status: 'active',
        primary_position: position,
      } as Database['public']['Tables']['team_members']['Insert']);

      if (assignmentError) {
        logger.error(
          { error: assignmentError, userId, teamId },
          'Failed to assign coach to team after invitation',
        );
      }
    }
  }
};

export const setCoachPassword = async (email: string, password: string): Promise<void> => {
  // Find user by email - listUsers may paginate, so we need to check all pages
  let allUsers: User[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (listError) {
      throw badRequest(`Failed to list users: ${listError.message}`);
    }

    if (!data || !data.users || data.users.length === 0) {
      hasMore = false;
      break;
    }

    allUsers = allUsers.concat(data.users);

    // Check if we found the user (case-insensitive email comparison)
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      // Update user password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password,
      });

      if (updateError) {
        throw badRequest(updateError.message ?? 'Failed to set password');
      }

      logger.info({ userId: user.id, email }, 'Password set for invited coach');
      return;
    }

    // If we got fewer users than requested, we're on the last page
    if (data.users.length < 1000) {
      hasMore = false;
    } else {
      page++;
    }
  }

  // User not found after checking all pages
  throw badRequest('User not found');
};
