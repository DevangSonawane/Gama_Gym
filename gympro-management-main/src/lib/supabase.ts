import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qhhegfmxnhhhfudyoxmj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaGVnZm14bmhoaGZ1ZHlveG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDc5MzMsImV4cCI6MjA4MjQyMzkzM30.L_226-y0Pu7hYJeJa8A3QscMGP_Z7ab9uU3nKKj_5Qo';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const DEFAULT_GYM_ID =
  import.meta.env.VITE_DEFAULT_GYM_ID || '409beae5-a699-424c-9c73-968574a9c341';



