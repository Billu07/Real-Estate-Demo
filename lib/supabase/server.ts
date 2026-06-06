import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase is optional in the demo. When env vars are absent the app runs on the
 * seeded store (see lib/store.ts). When configured, the same domain shapes load
 * from Postgres — see docs/supabase-schema.sql.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createServiceSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service environment variables are not configured.");
  return createClient(url, key, { auth: { persistSession: false } });
}
