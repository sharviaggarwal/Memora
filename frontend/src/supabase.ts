import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qhtssinoydmnllyfnrzj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodHNzaW5veWRtbmxseWZucnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMzQ0NTEsImV4cCI6MjEwODYxMDQ1MX0.WuXpUlp_F98xDCSQ3tTsKLvYqqF0zYQ1-RDHFqtLEo4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
