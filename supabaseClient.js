import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey && supabaseKey !== 'your_supabase_anon_key')
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (!supabase) {
  console.warn('⚠️ Supabase URL or Anon Key is missing. Database operations will be skipped.');
}
