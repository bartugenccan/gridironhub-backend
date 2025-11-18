import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { env } from '../config/env';
import { unauthorized } from '../utils/http-error';
import type { Database } from '../types/supabase';

export type AdminSupabaseClient = SupabaseClient<Database>;
export type ServiceSupabaseClient = SupabaseClient<Database>;

export const supabaseAdmin: AdminSupabaseClient = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export const createSupabaseClient = (accessToken?: string): ServiceSupabaseClient =>
  createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  });

export const getUserFromAccessToken = async (
  accessToken: string,
): Promise<{ client: ServiceSupabaseClient; user: User }> => {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw unauthorized('Invalid Supabase access token');
  }

  return { client, user: data.user };
};
