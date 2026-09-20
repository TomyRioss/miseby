"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessUser } from "@/lib/auth/guards";
import { getOrganizationForMember, updateOrganization, generateUniqueSlug } from "@/lib/services/organizations";
import { getOrCreateMiseLinkPage, updateTheme } from "@/lib/services/miselink";
import {
  businessProfileSchema,
  restaurantAppearanceSchema,
  restaurantCategorySchema,
  restaurantProductSchema,
  restaurantIaSchema,
  restaurantHoursSchema,
  saveMenuSchema,
} from "@/lib/validations/restaurant";
import { getRestaurantData } from "@/lib/restaurant-theme";

type ActionResult = { ok: true } | { ok: false; error: string };

function fail(e: unknown, fallback: string): ActionResult {
  console.error("[restaurant]", e);
  return { ok: false, error: e instanceof Error ? e.message : fallback };
}

async function currentOrg() {
  const user = await requireBusinessUser();
  const data = await getOrganizationForMember(user.id);
  if (!data?.organization) throw new Error("No estás asociado a ningún negocio.");
  return { user, org: data.organization };
}

export async function updateBusinessProfileAction(input: unknown): Promise<ActionResult & { slug?: string }> {
  try {
    const parsed = businessProfileSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    const { user, org } = await currentOrg();
    if (user.role !== "business_owner") return { ok: false, error: "Solo el administrador puede editar." };
    const nameChanged = parsed.data.commercialName.trim() !== (org.commercialName ?? "").trim();
    let slug: string | undefined;
    if (nameChanged) {
      const { generateUniqueSlug } = await import("@/lib/services/organizations");
      slug = await generateUniqueSlug(parsed.data.commercialName.trim());
      await updateOrganization(org.id, { ...parsed.data, slug } as Parameters<typeof updateOrganization>[1], user.id);
      // Sincroniza nombre visible de la carta con el nombre real.
      try {
        const page = await getOrCreateMiseLinkPage(user.id);
        const current = getRestaurantData(page.theme);
        await updateTheme(user.id, { restaurant: { ...current, appearance: { ...current.appearance, restaurantName: parsed.data.commercialName.trim() } } } as Record<string, unknown>);
      } catch (e) {
        console.error("[restaurant] sync appearance name", e);
      }
      revalidatePath(`/menu/${org.slug}`);
      revalidatePath(`/catalogo/${org.slug}`);
      if (slug) revalidatePath(`/menu/${slug}`);
      if (slug) revalidatePath(`/catalogo/${slug}`);
    } else {
      await updateOrganization(org.id, parsed.data, user.id);
    }
    revalidatePath("/dashboard/negocio");
    revalidatePath("/dashboard/menu");
    return { ok: true, ...(slug ? { slug } : {}) };
  } catch (e) {
    return fail(e, "No se pudo guardar el negocio.");
  }
}

export async function saveRestaurantHoursAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = restaurantHoursSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    const { user } = await currentOrg();
    await getOrCreateMiseLinkPage(user.id);
    await updateTheme(user.id, { restaurant: { ...(await currentRestaurant()), ...parsed.data } } as Record<string, unknown>);
    revalidatePath("/dashboard/negocio");
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo guardar horarios y contacto.");
  }
}

async function currentRestaurant() {
  const { user } = await currentOrg();
  const page = await getOrCreateMiseLinkPage(user.id);
  return getRestaurantData(page.theme);
}

export async function saveAppearanceAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = restaurantAppearanceSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Diseño inválido" };
    const { user, org } = await currentOrg();
    const current = await currentRestaurant();
    await getOrCreateMiseLinkPage(user.id);
    const prevAp = current.appearance ?? {};
    await updateTheme(user.id, { restaurant: { ...current, appearance: { ...prevAp, ...parsed.data } } } as Record<string, unknown>);
    revalidatePath("/dashboard/apariencia");
    revalidatePath("/dashboard/menu");
    revalidatePath("/dashboard/catalogo");
    revalidatePath(`/menu/${org.slug}`, "page");
    revalidatePath(`/catalogo/${org.slug}`, "page");
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo guardar la apariencia.");
  }
}

export async function saveCategoriesAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = restaurantCategorySchema.array().max(100).safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Categorías inválidas" };
    const { user } = await currentOrg();
    const current = await currentRestaurant();
    const sorted = [...parsed.data].sort((a, b) => a.order - b.order);
    await getOrCreateMiseLinkPage(user.id);
    await updateTheme(user.id, { restaurant: { ...current, categories: sorted } } as Record<string, unknown>);
    revalidatePath("/dashboard/menu");
    revalidatePath("/dashboard/categorias");
    revalidatePath("/dashboard/catalogo");
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudieron guardar las categorías.");
  }
}

export async function saveProductsAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = restaurantProductSchema.array().max(500).safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Productos inválidos" };
    const { user } = await currentOrg();
    const current = await currentRestaurant();
    await getOrCreateMiseLinkPage(user.id);
    await updateTheme(user.id, { restaurant: { ...current, products: parsed.data } } as Record<string, unknown>);
    revalidatePath("/dashboard/menu");
    revalidatePath("/dashboard/productos");
    revalidatePath("/dashboard/catalogo");
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudieron guardar los productos.");
  }
}

export type SaveMenuResult = ActionResult & { updatedAt?: string; slug?: string };

export async function saveMenuAction(input: unknown): Promise<SaveMenuResult> {
  try {
    const parsed = saveMenuSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Menú inválido" };
    const { user, org } = await currentOrg();
    const current = await currentRestaurant();
    const base = parsed.data.baseUpdatedAt;
    if (base !== undefined && (current.updatedAt ?? "") !== base) {
      return { ok: false, error: "Otra página guardó cambios mientras editabas. Recargá para ver la versión actualizada y reintentá." };
    }
    const now = new Date().toISOString();
    const sorted = [...parsed.data.categories].sort((a, b) => a.order - b.order);
    const nextName = parsed.data.restaurantName?.trim().slice(0, 120);
    const currentName = typeof current.appearance?.restaurantName === "string" ? current.appearance.restaurantName : "";
    const appearance = {
      ...current.appearance,
      ...(nextName !== undefined ? { restaurantName: nextName } : {}),
    };
    let slug: string | undefined;
    if (nextName !== undefined && nextName.length > 0 && nextName !== currentName) {
      const fresh = await generateUniqueSlug(nextName);
      if (fresh !== org.slug) {
        await updateOrganization(org.id, { slug: fresh }, user.id);
        slug = fresh;
      }
    }
    await getOrCreateMiseLinkPage(user.id);
    await updateTheme(user.id, { restaurant: { ...current, appearance, categories: sorted, products: parsed.data.products, updatedAt: now } } as Record<string, unknown>);
    revalidatePath("/dashboard/menu");
    revalidatePath("/dashboard/catalogo");
    revalidatePath("/dashboard/categorias");
    revalidatePath("/dashboard/productos");
    revalidatePath(`/menu/${org.slug}`, "page");
    revalidatePath(`/catalogo/${org.slug}`, "page");
    if (slug) {
      revalidatePath(`/menu/${slug}`, "page");
      revalidatePath(`/catalogo/${slug}`, "page");
    }
    return { ok: true, updatedAt: now, slug };
  } catch (e) {
    return fail(e, "No se pudo guardar el menú.");
  }
}

export async function saveIaAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = restaurantIaSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    const { user } = await currentOrg();
    const current = await currentRestaurant();
    await getOrCreateMiseLinkPage(user.id);
    await updateTheme(user.id, { restaurant: { ...current, ia: parsed.data } } as Record<string, unknown>);
    revalidatePath("/dashboard/mise-ia");
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo guardar Mise IA.");
  }
}

const PRODUCT_IMAGE_MAX = 5 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function uploadProductImageAction(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const { randomUUID } = await import("crypto");
    const { getSupabaseAdmin, AVATARS_BUCKET, ensureAvatarsBucket } = await import("@/lib/supabase/server");
    const user = await requireBusinessUser();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Elegí una imagen." };
    const ext = PRODUCT_IMAGE_TYPES.get(file.type);
    if (!ext) return { ok: false, error: "Solo JPG, PNG o WebP." };
    if (file.size > PRODUCT_IMAGE_MAX) return { ok: false, error: "Máximo 5 MB." };
    const page = await getOrCreateMiseLinkPage(user.id);
    const supabase = getSupabaseAdmin();
    await ensureAvatarsBucket(supabase);
    const path = `${page.organizationId}/prd-${randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error } = await supabase.storage.from(AVATARS_BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
    if (error) {
      console.error("[product image]", error);
      return { ok: false, error: "No se pudo subir. Probá de nuevo." };
    }
    const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) return { ok: false, error: "No se pudo obtener la URL." };
    return { ok: true, url: data.publicUrl };
  } catch (e) {
    console.error("[product image]", e);
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo subir." };
  }
}

export async function setMenuPublishedAction(published: boolean): Promise<ActionResult> {
  try {
    const { user, org } = await currentOrg();
    const current = await currentRestaurant();
    await getOrCreateMiseLinkPage(user.id);
    await updateTheme(user.id, { restaurant: { ...current, menuPublished: published } } as Record<string, unknown>);
    revalidatePath("/dashboard/catalogo");
    revalidatePath("/dashboard/menu");
    revalidatePath(`/menu/${org.slug}`, "page");
    revalidatePath(`/catalogo/${org.slug}`, "page");
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo cambiar el estado del menú.");
  }
}
