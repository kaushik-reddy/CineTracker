import { appParams } from '@/lib/app-params';
import { localBase44 } from './localStorageMock';
import { supabaseAdapter } from './supabaseAdapter';

const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabase = VITE_SUPABASE_URL && VITE_SUPABASE_ANON_KEY;

// Check if we should use local mock (force offline or missing keys)
// If supabase keys are present, we default to using them (Shared Data Mode)
const forceOffline = import.meta.env.VITE_FORCE_OFFLINE === 'true';

let base44Instance;

if (hasSupabase && !forceOffline) {
  console.log('[Base44Client] Using Supabase Adapter (Cloud DB)');
  base44Instance = supabaseAdapter;
} else {
  console.log('[Base44Client] Using localStorage mock (Offline)');
  base44Instance = localBase44;
}

export const base44 = base44Instance;
