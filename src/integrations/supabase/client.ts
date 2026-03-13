import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { ENV } from '@/config/env';

// ✅ استخدام المتغيرات من ENV
const supabaseUrl = ENV.SUPABASE_URL;
const supabaseKey = ENV.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});