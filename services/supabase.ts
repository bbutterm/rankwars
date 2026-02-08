import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from environment variables, fall back to hardcoded values for compatibility
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dqjziuhotbnjmzbzvidl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxanppdWhvdGJuam16Ynp2aWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjEyNTMsImV4cCI6MjA4NjA5NzI1M30.rB8rgzq8OWozUR8WVHaLp0KtGDVvytzL4hRcQt6VbU4';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Initializing the client with environment variables
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn("Supabase is not configured properly. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env");
}
