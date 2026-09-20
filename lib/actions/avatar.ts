"use server";

import { randomUUID } from "crypto";
import { requireBusinessUser } from "@/lib/auth/guards";
import { getOrCreateMiseLinkPage } from "@/lib/services/miselink";
import { getSupabaseAdmin, AVATARS_BUCKET, ensureAvatarsBucket } from "@/lib/supabase/server";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type Result = { ok: true; url: string } | { ok: false; error: string };

export async function uploadAvatarAction(formData: FormData): Promise<Result> {
  try {
    const user = await requireBusinessUser();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Elegí una imagen." };
    }
    const ext = ALLOWED.get(file.type);
    if (!ext) {
      return { ok: false, error: "Solo JPG, PNG o WebP." };
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, error: "Máximo 5 MB." };
    }
    const page = await getOrCreateMiseLinkPage(user.id);
    const supabase = getSupabaseAdmin();
    await ensureAvatarsBucket(supabase);
    const path = `${page.organizationId}/${randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (error) {
      console.error("[avatar upload]", error);
      return { ok: false, error: "No se pudo subir la imagen. Probá de nuevo." };
    }
    const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) {
      return { ok: false, error: "No se pudo obtener la URL." };
    }
    return { ok: true, url: data.publicUrl };
  } catch (e) {
    console.error("[avatar upload]", e);
    const message = e instanceof Error ? e.message : "No se pudo subir.";
    return { ok: false, error: message };
  }
}

export async function uploadBannerAction(formData: FormData): Promise<Result> {
  try {
    const user = await requireBusinessUser();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Elegí una imagen." };
    }
    const ext = ALLOWED.get(file.type);
    if (!ext) {
      return { ok: false, error: "Solo JPG, PNG o WebP." };
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, error: "Máximo 5 MB." };
    }
    const page = await getOrCreateMiseLinkPage(user.id);
    const supabase = getSupabaseAdmin();
    await ensureAvatarsBucket(supabase);
    const path = `${page.organizationId}/banner-${randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (error) {
      console.error("[banner upload]", error);
      return { ok: false, error: "No se pudo subir la imagen. Probá de nuevo." };
    }
    const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) {
      return { ok: false, error: "No se pudo obtener la URL." };
    }
    return { ok: true, url: data.publicUrl };
  } catch (e) {
    console.error("[banner upload]", e);
    const message = e instanceof Error ? e.message : "No se pudo subir.";
    return { ok: false, error: message };
  }
}
