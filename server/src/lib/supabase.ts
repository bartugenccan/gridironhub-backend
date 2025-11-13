import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Supabase types will be refined once the database schema is generated.
type Database = Record<string, never>;

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
