import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These values should be stored in .env.local and loaded here.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
