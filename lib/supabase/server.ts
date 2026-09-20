import "server-only";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.",
    );
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function ensureAvatarsBucket(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const { data: bucket, error } = await supabase.storage.getBucket(AVATARS_BUCKET);
  if (error && error.message?.toLowerCase().includes("not found")) {
    const { error: createError } = await supabase.storage.createBucket(AVATARS_BUCKET, {
      public: true,
    });
    if (createError) throw createError;
    return;
  }
  if (error) throw error;
  // Si el bucket existe pero no es público, las URLs son inaccesibles
  // (imagen rota sin error). Asegurar público.
  if (bucket && bucket.public !== true) {
    const { error: updateError } = await supabase.storage.updateBucket(AVATARS_BUCKET, {
      public: true,
    });
    if (updateError) throw updateError;
  }
}

export const AVATARS_BUCKET = "avatars";
