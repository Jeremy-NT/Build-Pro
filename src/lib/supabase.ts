import { createClient } from '@supabase/supabase-js';

// Retrieve values from environment or define solid placeholders so the bundle doesn't crash on load
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are missing. ' +
    'Please add them to your environment secrets or local .env file.'
  );
}

// Fallback to a valid format URL if empty to satisfy the SDK on boot
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey);
