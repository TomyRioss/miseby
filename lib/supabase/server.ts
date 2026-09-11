import "server-only";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.",
    );
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export const AVATARS_BUCKET = "avatars";
