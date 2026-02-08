import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Provided by the user for immediate integration
const supabaseUrl = 'https://dqjziuhotbnjmzbzvidl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxanppdWhvdGJuam16Ynp2aWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjEyNTMsImV4cCI6MjA4NjA5NzI1M30.rB8rgzq8OWozUR8WVHaLp0KtGDVvytzL4hRcQt6VbU4';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Initializing the client with the hardcoded credentials
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn("Supabase is not configured properly.");
}
