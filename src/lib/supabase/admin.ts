import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Full-access client. Server code only. Never import this in a component. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase secret key is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
