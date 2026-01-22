import { createClient } from '@supabase/supabase-js';

// Hard-coded fallbacks to ensure connection works
const FALLBACK_URL = 'https://rbntfzzlzqgdeskhqbza.supabase.co';
const FALLBACK_KEY = 'sb_publishable_GpaxgZeqjvOYX7OlWV5kmA_Fhzivl9s';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key missing!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
