import { createClient } from '@supabase/supabase-js';

// 1. Get keys from Vite Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Safety Check: Warn in console if missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 Supabase Keys are MISSING! Check your .env file.");
}

// 3. Create the client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);