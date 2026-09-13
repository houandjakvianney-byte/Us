import { createClient } from '@supabase/supabase-js';

// Configuration from environment variables with safe defaults from provided credentials
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://alayuxixflbzkuejosdd.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsYXl1eGl4Zmxiemt1ZWpvc2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNDg3MTAsImV4cCI6MjEwNDgyNDcxMH0.qIFzpNvT4HHl_sOR8LAL8D4cWoPTlH2ItltW7G1bx5A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Offline Storage Cache Helpers for PWA
const CACHE_KEYS = {
  PROFILE: 'deux_pwa_cache_profile',
  COUPLE: 'deux_pwa_cache_couple',
  MEMBERS: 'deux_pwa_cache_members',
  MEMORIES: 'deux_pwa_cache_memories',
  LOVE_NOTES: 'deux_pwa_cache_love_notes',
  BUCKET_LIST: 'deux_pwa_cache_bucket_list',
};

export const localCache = {
  get<T>(key: keyof typeof CACHE_KEYS): T | null {
    try {
      const val = localStorage.getItem(CACHE_KEYS[key]);
      return val ? (JSON.parse(val) as T) : null;
    } catch {
      return null;
    }
  },
  set<T>(key: keyof typeof CACHE_KEYS, data: T): void {
    try {
      localStorage.setItem(CACHE_KEYS[key], JSON.stringify(data));
    } catch {
      // ignore storage quota errors
    }
  },
  clear(): void {
    Object.values(CACHE_KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
