import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import type { AuthenticatedUser } from '../modules/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      supabase?: SupabaseClient<Database>;
    }
  }
}

export {};
