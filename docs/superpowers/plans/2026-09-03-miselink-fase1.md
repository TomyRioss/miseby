# MISE LINK — Fase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página pública tipo Linktree en `miseby.com/{username}` editable desde el dashboard del negocio con plan `mise_link`.

**Architecture:** Nuevas tablas Prisma (`MiseLinkPage` 1:1 con `Organization`, `MiseLinkItem`, `MiseLinkSocial`). Backend con el patrón del proyecto: `lib/services/miselink.ts` (`server-only`) + `lib/actions/miselink.ts` (`"use server"`, `ActionResult`). Render público en `app/(public)/[username]/page.tsx` usando componentes compartidos en `components/miselink/render/`, reutilizados por el preview en vivo del editor client-side.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 6 + Postgres (Supabase), next-auth v5, Tailwind v4, shadcn (Button, Switch, Tabs, Input, Field, AlertDialog, Tooltip), react-hook-form + zod, sonner, `@dnd-kit` (nuevo).

**Spec:** `docs/superpowers/specs/2026-09-03-miselink-fase1-design.md`

## Global Constraints

- Metodología MVC / componentes modulares. Ningún archivo de componente > 500 líneas.
- TailwindCSS para estilos. Prohibido tocar `app/globals.css`. Prohibido CSS puro.
- Prohibido SVG para imágenes/iconos — usar `lucide-react` (ya instalado).
- shadcn para componentes prefabricados.
- Errores siempre catcheados: feedback visual (`toast` de sonner) + `console.error`.
- Diseño responsivo (mobile + desktop) siempre.
- **Nunca** ejecutar comandos de Prisma / migraciones / DB sin OK explícito del usuario en ese mensaje puntual. Este plan marca los puntos donde hay que pedirlo.
- Server Actions devuelven `type ActionResult = { ok: true } | { ok: false; error: string }`. Nunca lanzan al cliente.
- Servicios: `import "server-only"` en la primera línea. Mensajes de error en español.
- Guard para acciones business: `requireBusinessUser()` de `lib/auth/guards.ts`.
- `npm run build` y `npm run lint` deben pasar al final de cada tarea que toque código.
- Commits: Conventional Commits, en español el cuerpo si hace falta. Terminar mensajes de commit con:
  ```
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01RoNwPFm8bigGiH9KuaseC3
  ```

---

## File Structure

**Prisma**
- Modify `prisma/schema.prisma` — 3 modelos nuevos + enum `MiseLinkItemType` + relación inversa en `Organization`.

**Backend / lib**
- Create `lib/miselink/reserved-usernames.ts` — `RESERVED_USERNAMES: Set<string>`.
- Create `lib/validations/miselink.ts` — schemas zod + tipos.
- Create `lib/validations/miselink.check.ts` — script `assert` ejecutable con `tsx`.
- Create `lib/services/miselink.ts` — toda la lógica de datos.
- Create `lib/actions/miselink.ts` — server actions.
- Modify `lib/mise-labels.ts` — `MISELINK_SOCIAL_NETWORKS` (label + icono).

**Render público (compartido)**
- Create `components/miselink/render/miselink-public-view.tsx` — orquestador de render.
- Create `components/miselink/render/miselink-header.tsx` — avatar + nombre + bio.
- Create `components/miselink/render/miselink-socials.tsx` — fila de iconos.
- Create `components/miselink/render/miselink-button.tsx` — botón de enlace.
- Create `components/miselink/render/types.ts` — tipos de la data de render.

**Ruta pública**
- Create `app/(public)/[username]/page.tsx` — Server Component.
- Create `app/(public)/[username]/error.tsx` — error boundary mínimo.
- Modify `proxy.ts` — sólo comentario aclaratorio.

**Editor (dashboard)**
- Modify `app/(business)/dashboard/miselink/page.tsx` — reemplaza placeholder, carga data.
- Create `components/miselink/editor/miselink-editor.tsx` — layout + tabs + estado + preview.
- Create `components/miselink/editor/links-tab.tsx` — lista drag-drop de enlaces.
- Create `components/miselink/editor/link-row.tsx` — fila de enlace individual.
- Create `components/miselink/editor/socials-tab-section.tsx` — lista de redes.
- Create `components/miselink/editor/profile-tab.tsx` — form de perfil.
- Create `components/miselink/editor/settings-tab.tsx` — username + publicar + copiar URL.
- Create `components/miselink/editor/no-plan-state.tsx` — estado sin plan `mise_link`.
- Create `hooks/use-miselink-state.ts` — estado local optimista + wrappers de acciones.

**Sidebar**
- Modify `components/business/business-header.tsx` — item "MISE LINK" en `BusinessSidebar`.

---

## Task 1: Schema Prisma

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: modelos Prisma `MiseLinkPage`, `MiseLinkItem`, `MiseLinkSocial`; enum `MiseLinkItemType`. Tipos generados en `@prisma/client`.

- [ ] **Step 1: Agregar enum + modelos al final de `prisma/schema.prisma`**

```prisma
enum MiseLinkItemType {
  link
  header
  collection
  embed
}

model MiseLinkPage {
  id             String  @id @default(uuid()) @db.Uuid
  organizationId String  @unique @map("organization_id") @db.Uuid
  username       String  @unique
  published      Boolean @default(false)

  displayName   String? @map("display_name")
  bio           String? @db.Text
  avatarUrl     String? @map("avatar_url")
  showFollowers Boolean @default(false) @map("show_followers")

  theme Json @default("{}")

  metaTitle       String? @map("meta_title")
  metaDescription String? @map("meta_description")
  passwordHash    String? @map("password_hash")

  organization Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  items        MiseLinkItem[]
  socials      MiseLinkSocial[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("miselink_pages")
}

model MiseLinkItem {
  id       String           @id @default(uuid()) @db.Uuid
  pageId   String           @map("page_id") @db.Uuid
  type     MiseLinkItemType @default(link)
  parentId String?          @map("parent_id") @db.Uuid
  position Int
  active   Boolean          @default(true)

  title String?
  url   String?
  data  Json   @default("{}")

  scheduledStart DateTime? @map("scheduled_start")
  scheduledEnd   DateTime? @map("scheduled_end")
  clickCount     Int       @default(0) @map("click_count")

  page MiseLinkPage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([pageId, position])
  @@map("miselink_items")
}

model MiseLinkSocial {
  id       String @id @default(uuid()) @db.Uuid
  pageId   String @map("page_id") @db.Uuid
  network  String
  url      String
  position Int

  page MiseLinkPage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId, position])
  @@map("miselink_socials")
}
```

- [ ] **Step 2: Agregar la relación inversa en el modelo `Organization`**

En `model Organization`, junto a las otras relaciones (`members`, `memberships`, …), agregar:

```prisma
  miselinkPage MiseLinkPage?
```

- [ ] **Step 3: Validar el schema (no migra)**

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 4: Generar el client (no toca DB)**

Run: `npx prisma generate`
Expected: `Generated Prisma Client` sin errores.

- [ ] **Step 5: PARAR y pedir OK explícito al usuario para aplicar la migración**

Mensaje exacto al usuario: "Schema listo. Para crear la migración necesito tu OK para correr `npx prisma migrate dev --name miselink_fase1` contra la DB. ¿Lo corro?"
- Si dice sí: `npx prisma migrate dev --name miselink_fase1`.
- Si dice no: dejar anotado que la migración queda pendiente; el resto del plan puede escribirse igual porque `prisma generate` ya dio los tipos. **No** seguir a tareas que ejecuten queries hasta que la migración exista.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(miselink): schema fase 1 (page, item, social)"
```

---

## Task 2: Palabras reservadas

**Files:**
- Create: `lib/miselink/reserved-usernames.ts`

**Interfaces:**
- Produces: `RESERVED_USERNAMES: ReadonlySet<string>`

- [ ] **Step 1: Crear el archivo**

```ts
// Usernames que no se pueden reclamar porque colisionan con rutas
// reales o son nombres sensibles de la plataforma.
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "dashboard",
  "control",
  "api",
  "invitaciones",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "admin",
  "static",
  "assets",
  "public",
  "u",
  "miselink",
  "mise",
  "soporte",
  "support",
  "terms",
  "privacy",
  "legal",
  "settings",
  "account",
  "cuenta",
]);
```

- [ ] **Step 2: Commit**

```bash
git add lib/miselink/reserved-usernames.ts
git commit -m "feat(miselink): lista de usernames reservados"
```

---

## Task 3: Validaciones zod + check script

**Files:**
- Create: `lib/validations/miselink.ts`
- Create: `lib/validations/miselink.check.ts`

**Interfaces:**
- Consumes: `RESERVED_USERNAMES` de `lib/miselink/reserved-usernames.ts`
- Produces:
  - `usernameSchema: z.ZodType<string>` (aplica trim + lowercase, salida `string`)
  - `profileSchema` → `{ displayName?: string; bio?: string; avatarUrl?: string; showFollowers?: boolean }`
  - `linkItemSchema` → `{ title: string; url: string; active?: boolean }`, tipo `LinkItemInput`
  - `socialSchema` → `{ network: SocialNetwork; url: string }`, tipo `SocialInput`
  - `SocialNetwork = "instagram" | "tiktok" | "youtube" | "x" | "facebook" | "spotify" | "website"`
  - `reorderSchema` → `{ ids: string[] }`

- [ ] **Step 1: Crear `lib/validations/miselink.ts`**

```ts
import { z } from "zod";
import { RESERVED_USERNAMES } from "@/lib/miselink/reserved-usernames";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Mínimo 3 caracteres")
  .max(30, "Máximo 30 caracteres")
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Solo letras, números y guiones (sin espacios)")
  .refine((v) => !RESERVED_USERNAMES.has(v), "Ese nombre no está disponible");

export const profileSchema = z.object({
  displayName: z.string().trim().max(60, "Máximo 60 caracteres").optional(),
  bio: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
  avatarUrl: z
    .string()
    .trim()
    .url("URL inválida")
    .max(2000)
    .optional()
    .or(z.literal("")),
  showFollowers: z.boolean().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const SOCIAL_NETWORKS = [
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "facebook",
  "spotify",
  "website",
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const linkItemSchema = z.object({
  title: z.string().trim().min(1, "Título requerido").max(100, "Máximo 100 caracteres"),
  url: z.string().trim().url("URL inválida").max(2000),
  active: z.boolean().optional(),
});
export type LinkItemInput = z.infer<typeof linkItemSchema>;

export const socialSchema = z.object({
  network: z.enum(SOCIAL_NETWORKS),
  url: z.string().trim().url("URL inválida").max(2000),
});
export type SocialInput = z.infer<typeof socialSchema>;

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Lista vacía"),
});
```

- [ ] **Step 2: Crear el check `lib/validations/miselink.check.ts`**

```ts
import assert from "node:assert/strict";
import { usernameSchema, linkItemSchema } from "./miselink";

// válidos
for (const v of ["tomy", "mise-by", "abc123", "a-b-c", "x".repeat(30)]) {
  assert.equal(usernameSchema.safeParse(v).success, true, `debería aceptar: ${v}`);
}

// normaliza
assert.equal(usernameSchema.parse("  ToMy  "), "tomy", "trim + lowercase");

// inválidos
for (const v of ["ab", "x".repeat(31), "-tomy", "tomy-", "to my", "to_my", "tomy!", "dashboard", "api"]) {
  assert.equal(usernameSchema.safeParse(v).success, false, `debería rechazar: ${v}`);
}

// link item
assert.equal(linkItemSchema.safeParse({ title: "Sitio", url: "https://x.com" }).success, true);
assert.equal(linkItemSchema.safeParse({ title: "", url: "https://x.com" }).success, false);
assert.equal(linkItemSchema.safeParse({ title: "Sitio", url: "no-url" }).success, false);

console.log("miselink validations OK");
```

- [ ] **Step 3: Correr el check y verificar que pasa**

Run: `npx tsx lib/validations/miselink.check.ts`
Expected: `miselink validations OK` y exit 0.

- [ ] **Step 4: Romper a propósito para ver que falla**

Cambiar temporalmente `["ab", ...]` para incluir `"tomy"` en la lista de inválidos. Correr de nuevo.
Expected: `AssertionError` con `debería rechazar: tomy`. Revertir el cambio.

- [ ] **Step 5: Commit**

```bash
git add lib/validations/miselink.ts lib/validations/miselink.check.ts
git commit -m "feat(miselink): validaciones zod + check script"
```

---

## Task 4: Labels de redes sociales

**Files:**
- Modify: `lib/mise-labels.ts`

**Interfaces:**
- Consumes: `SocialNetwork` de `lib/validations/miselink.ts`
- Produces: `MISELINK_SOCIAL_NETWORKS: Record<SocialNetwork, { label: string; icon: LucideIcon }>`

- [ ] **Step 1: Agregar al final de `lib/mise-labels.ts`**

```ts
import { Instagram, Youtube, Facebook, Music2, Globe, AtSign } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SocialNetwork } from "@/lib/validations/miselink";

// TikTok no tiene icono propio en lucide-react en esta versión → Music2 como sustituto.
export const MISELINK_SOCIAL_NETWORKS: Record<
  SocialNetwork,
  { label: string; icon: LucideIcon }
> = {
  instagram: { label: "Instagram", icon: Instagram },
  tiktok: { label: "TikTok", icon: Music2 },
  youtube: { label: "YouTube", icon: Youtube },
  x: { label: "X / Twitter", icon: AtSign },
  facebook: { label: "Facebook", icon: Facebook },
  spotify: { label: "Spotify", icon: Music2 },
  website: { label: "Sitio web", icon: Globe },
};
```

- [ ] **Step 2: Verificar que los iconos existen en la versión instalada de lucide-react**

Run: `node -e "const i=require('lucide-react'); console.log(['Instagram','Youtube','Facebook','Music2','Globe','AtSign'].map(n=>[n, typeof i[n]]))"`
Expected: cada uno `'object'` o `'function'`. Si alguno es `'undefined'`, sustituir por `Link2` y anotarlo.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/mise-labels.ts
git commit -m "feat(miselink): labels e iconos de redes sociales"
```

---

## Task 5: Servicio de datos

**Files:**
- Create: `lib/services/miselink.ts`

**Interfaces:**
- Consumes:
  - `getOrganizationForMember(userId: string)` de `lib/services/organizations.ts` → `{ organization, role, membership } | null`
  - `prisma` de `lib/prisma`
  - `slugify` de `lib/slug`
  - `RESERVED_USERNAMES`, schemas de Task 3
- Produces (todas `async`, todas lanzan `Error` con mensaje español si no autorizado / inválido):
  - `getOrCreateMiseLinkPage(userId: string): Promise<MiseLinkPageWithRelations>`
  - `getPublicPageByUsername(username: string): Promise<MiseLinkPageWithRelations | null>`
  - `getOwnPageByUsername(userId: string, username: string): Promise<MiseLinkPageWithRelations | null>`
  - `updateUsername(userId: string, username: string): Promise<void>`
  - `updateProfile(userId: string, data: ProfileInput): Promise<void>`
  - `setPublished(userId: string, published: boolean): Promise<void>`
  - `createLink(userId: string, data: LinkItemInput): Promise<string>` (devuelve id nuevo)
  - `updateLink(userId: string, itemId: string, data: Partial<LinkItemInput>): Promise<void>`
  - `deleteLink(userId: string, itemId: string): Promise<void>`
  - `reorderLinks(userId: string, ids: string[]): Promise<void>`
  - `createSocial(userId: string, data: SocialInput): Promise<string>`
  - `deleteSocial(userId: string, socialId: string): Promise<void>`
  - `type MiseLinkPageWithRelations = MiseLinkPage & { items: MiseLinkItem[]; socials: MiseLinkSocial[] }`

- [ ] **Step 1: Crear `lib/services/miselink.ts`**

```ts
import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { RESERVED_USERNAMES } from "@/lib/miselink/reserved-usernames";
import { getOrganizationForMember } from "@/lib/services/organizations";
import type { MiseLinkPage, MiseLinkItem, MiseLinkSocial } from "@prisma/client";
import type { ProfileInput, LinkItemInput, SocialInput } from "@/lib/validations/miselink";

export type MiseLinkPageWithRelations = MiseLinkPage & {
  items: MiseLinkItem[];
  socials: MiseLinkSocial[];
};

const PAGE_INCLUDE = {
  items: { orderBy: { position: "asc" } },
  socials: { orderBy: { position: "asc" } },
} as const;

async function resolveOrgWithMiseLink(userId: string) {
  const data = await getOrganizationForMember(userId);
  if (!data?.organization) throw new Error("No estás asociado a ningún negocio.");
  const hasPlan =
    data.membership?.plan.code === "mise_link" &&
    (data.membership.status === "active" || data.membership.status === "trial");
  if (!hasPlan) throw new Error("Tu negocio no tiene el plan MISE LINK activo.");
  return data.organization;
}

async function resolvePageForUser(userId: string): Promise<MiseLinkPageWithRelations> {
  const org = await resolveOrgWithMiseLink(userId);
  const page = await prisma.miseLinkPage.findUnique({
    where: { organizationId: org.id },
    include: PAGE_INCLUDE,
  });
  if (!page) throw new Error("La página MISE LINK todavía no existe.");
  return page;
}

async function generateUniqueUsername(base: string): Promise<string> {
  let root = slugify(base) || "mi-pagina";
  if (root.length < 3) root = `${root}-pagina`;
  root = root.slice(0, 24);
  let candidate = root;
  let n = 1;
  while (
    RESERVED_USERNAMES.has(candidate) ||
    (await prisma.miseLinkPage.findUnique({ where: { username: candidate } }))
  ) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

export async function getOrCreateMiseLinkPage(
  userId: string,
): Promise<MiseLinkPageWithRelations> {
  const org = await resolveOrgWithMiseLink(userId);
  const existing = await prisma.miseLinkPage.findUnique({
    where: { organizationId: org.id },
    include: PAGE_INCLUDE,
  });
  if (existing) return existing;

  const username = await generateUniqueUsername(org.slug ?? org.commercialName);
  return prisma.miseLinkPage.create({
    data: {
      organizationId: org.id,
      username,
      displayName: org.commercialName,
    },
    include: PAGE_INCLUDE,
  });
}

export async function getPublicPageByUsername(
  username: string,
): Promise<MiseLinkPageWithRelations | null> {
  const page = await prisma.miseLinkPage.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      items: { where: { active: true }, orderBy: { position: "asc" } },
      socials: { orderBy: { position: "asc" } },
    },
  });
  if (!page || !page.published) return null;
  return page;
}

export async function getOwnPageByUsername(
  userId: string,
  username: string,
): Promise<MiseLinkPageWithRelations | null> {
  const data = await getOrganizationForMember(userId).catch(() => null);
  if (!data?.organization) return null;
  const page = await prisma.miseLinkPage.findUnique({
    where: { username: username.toLowerCase() },
    include: PAGE_INCLUDE,
  });
  if (!page || page.organizationId !== data.organization.id) return null;
  return page;
}

export async function updateUsername(userId: string, username: string): Promise<void> {
  const page = await resolvePageForUser(userId);
  const next = username.toLowerCase();
  if (RESERVED_USERNAMES.has(next)) throw new Error("Ese nombre no está disponible.");
  try {
    await prisma.miseLinkPage.update({ where: { id: page.id }, data: { username: next } });
  } catch (e) {
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      throw new Error("Ese nombre ya está en uso.");
    }
    throw e;
  }
}

export async function updateProfile(userId: string, data: ProfileInput): Promise<void> {
  const page = await resolvePageForUser(userId);
  await prisma.miseLinkPage.update({
    where: { id: page.id },
    data: {
      displayName: data.displayName ?? null,
      bio: data.bio ?? null,
      avatarUrl: data.avatarUrl ? data.avatarUrl : null,
    },
  });
}

export async function setPublished(userId: string, published: boolean): Promise<void> {
  const page = await resolvePageForUser(userId);
  if (published) {
    const activeCount = await prisma.miseLinkItem.count({
      where: { pageId: page.id, active: true },
    });
    if (activeCount === 0) {
      throw new Error("Agregá al menos un enlace activo antes de publicar.");
    }
  }
  await prisma.miseLinkPage.update({ where: { id: page.id }, data: { published } });
}

export async function createLink(userId: string, data: LinkItemInput): Promise<string> {
  const page = await resolvePageForUser(userId);
  const last = await prisma.miseLinkItem.findFirst({
    where: { pageId: page.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const item = await prisma.miseLinkItem.create({
    data: {
      pageId: page.id,
      type: "link",
      title: data.title,
      url: data.url,
      active: data.active ?? true,
      position: (last?.position ?? -1) + 1,
    },
  });
  return item.id;
}

export async function updateLink(
  userId: string,
  itemId: string,
  data: Partial<LinkItemInput>,
): Promise<void> {
  const page = await resolvePageForUser(userId);
  const { count } = await prisma.miseLinkItem.updateMany({
    where: { id: itemId, pageId: page.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.url !== undefined ? { url: data.url } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
  });
  if (count === 0) throw new Error("Enlace no encontrado.");
}

export async function deleteLink(userId: string, itemId: string): Promise<void> {
  const page = await resolvePageForUser(userId);
  const { count } = await prisma.miseLinkItem.deleteMany({
    where: { id: itemId, pageId: page.id },
  });
  if (count === 0) throw new Error("Enlace no encontrado.");
}

export async function reorderLinks(userId: string, ids: string[]): Promise<void> {
  const page = await resolvePageForUser(userId);
  const owned = await prisma.miseLinkItem.findMany({
    where: { pageId: page.id },
    select: { id: true },
  });
  const ownedSet = new Set(owned.map((i) => i.id));
  if (ids.length !== ownedSet.size || ids.some((id) => !ownedSet.has(id))) {
    throw new Error("Lista de orden inválida.");
  }
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.miseLinkItem.update({ where: { id }, data: { position: index } }),
    ),
  );
}

export async function createSocial(userId: string, data: SocialInput): Promise<string> {
  const page = await resolvePageForUser(userId);
  const last = await prisma.miseLinkSocial.findFirst({
    where: { pageId: page.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const social = await prisma.miseLinkSocial.create({
    data: {
      pageId: page.id,
      network: data.network,
      url: data.url,
      position: (last?.position ?? -1) + 1,
    },
  });
  return social.id;
}

export async function deleteSocial(userId: string, socialId: string): Promise<void> {
  const page = await resolvePageForUser(userId);
  const { count } = await prisma.miseLinkSocial.deleteMany({
    where: { id: socialId, pageId: page.id },
  });
  if (count === 0) throw new Error("Red social no encontrada.");
}
```

- [ ] **Step 2: Typecheck vía build**

Run: `npm run build`
Expected: PASS. Si falla por tipos de Prisma (modelo no generado) → la migración de Task 1 no se aplicó; parar y pedir OK al usuario.

- [ ] **Step 3: Commit**

```bash
git add lib/services/miselink.ts
git commit -m "feat(miselink): servicio de datos"
```

---

## Task 6: Server Actions

**Files:**
- Create: `lib/actions/miselink.ts`

**Interfaces:**
- Consumes: funciones de `lib/services/miselink.ts` (Task 5), `requireBusinessUser` de `lib/auth/guards.ts`, schemas de Task 3, `revalidatePath` de `next/cache`.
- Produces (todas `Promise<ActionResult>` salvo donde se indica):
  - `updateUsernameAction(input: unknown)`
  - `updateProfileAction(input: unknown)`
  - `setPublishedAction(published: boolean)`
  - `createLinkAction(input: unknown): Promise<ActionResult & { id?: string }>`
  - `updateLinkAction(itemId: string, input: unknown)`
  - `deleteLinkAction(itemId: string)`
  - `reorderLinksAction(input: unknown)`
  - `createSocialAction(input: unknown): Promise<ActionResult & { id?: string }>`
  - `deleteSocialAction(socialId: string)`
  - `type ActionResult = { ok: true } | { ok: false; error: string }`

- [ ] **Step 1: Crear `lib/actions/miselink.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessUser } from "@/lib/auth/guards";
import * as service from "@/lib/services/miselink";
import {
  usernameSchema,
  profileSchema,
  linkItemSchema,
  socialSchema,
  reorderSchema,
} from "@/lib/validations/miselink";

type ActionResult = { ok: true } | { ok: false; error: string };

const EDITOR_PATH = "/dashboard/miselink";

function fail(error: unknown, fallback: string): { ok: false; error: string } {
  const message = error instanceof Error ? error.message : fallback;
  console.error("[miselink]", error);
  return { ok: false, error: message };
}

async function revalidateFor(userId: string) {
  revalidatePath(EDITOR_PATH);
  try {
    const page = await service.getOrCreateMiseLinkPage(userId);
    if (page.published) revalidatePath(`/${page.username}`);
  } catch {
    /* noop: revalidación best-effort */
  }
}

export async function updateUsernameAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    const parsed = usernameSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Nombre inválido" };
    }
    await service.updateUsername(user.id, parsed.data);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo actualizar el nombre.");
  }
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    await service.updateProfile(user.id, parsed.data);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo actualizar el perfil.");
  }
}

export async function setPublishedAction(published: boolean): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    await service.setPublished(user.id, published);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo cambiar el estado de publicación.");
  }
}

export async function createLinkAction(
  input: unknown,
): Promise<ActionResult & { id?: string }> {
  try {
    const user = await requireBusinessUser();
    const parsed = linkItemSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const id = await service.createLink(user.id, parsed.data);
    await revalidateFor(user.id);
    return { ok: true, id };
  } catch (e) {
    return fail(e, "No se pudo crear el enlace.");
  }
}

export async function updateLinkAction(
  itemId: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    const parsed = linkItemSchema.partial().safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    await service.updateLink(user.id, itemId, parsed.data);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo actualizar el enlace.");
  }
}

export async function deleteLinkAction(itemId: string): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    await service.deleteLink(user.id, itemId);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo eliminar el enlace.");
  }
}

export async function reorderLinksAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    const parsed = reorderSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    await service.reorderLinks(user.id, parsed.data.ids);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo reordenar.");
  }
}

export async function createSocialAction(
  input: unknown,
): Promise<ActionResult & { id?: string }> {
  try {
    const user = await requireBusinessUser();
    const parsed = socialSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const id = await service.createSocial(user.id, parsed.data);
    await revalidateFor(user.id);
    return { ok: true, id };
  } catch (e) {
    return fail(e, "No se pudo agregar la red social.");
  }
}

export async function deleteSocialAction(socialId: string): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    await service.deleteSocial(user.id, socialId);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo eliminar la red social.");
  }
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/miselink.ts
git commit -m "feat(miselink): server actions"
```

---

## Task 7: Componentes de render público (compartidos)

**Files:**
- Create: `components/miselink/render/types.ts`
- Create: `components/miselink/render/miselink-header.tsx`
- Create: `components/miselink/render/miselink-socials.tsx`
- Create: `components/miselink/render/miselink-button.tsx`
- Create: `components/miselink/render/miselink-public-view.tsx`

**Interfaces:**
- Consumes: `MISELINK_SOCIAL_NETWORKS` de `lib/mise-labels.ts`, `SocialNetwork` de `lib/validations/miselink.ts`.
- Produces:
  - `type RenderPage = { username: string; displayName: string | null; bio: string | null; avatarUrl: string | null }`
  - `type RenderItem = { id: string; title: string | null; url: string | null }`
  - `type RenderSocial = { id: string; network: string; url: string }`
  - `<MiseLinkPublicView page={RenderPage} items={RenderItem[]} socials={RenderSocial[]} />` — Server Component puro (sin `"use client"`, sin hooks, sin handlers), seguro de renderizar tanto en la ruta pública como dentro del editor client.

- [ ] **Step 1: `components/miselink/render/types.ts`**

```ts
export type RenderPage = {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

export type RenderItem = {
  id: string;
  title: string | null;
  url: string | null;
};

export type RenderSocial = {
  id: string;
  network: string;
  url: string;
};
```

- [ ] **Step 2: `components/miselink/render/miselink-header.tsx`**

```tsx
import { UserRound } from "lucide-react";
import type { RenderPage } from "./types";

export function MiseLinkHeader({ page }: { page: RenderPage }) {
  const name = page.displayName?.trim() || `@${page.username}`;
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <div className="h-24 w-24 overflow-hidden rounded-full border border-border bg-muted">
        {page.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <UserRound className="h-10 w-10" />
          </div>
        )}
      </div>
      <h1 className="text-lg font-semibold text-foreground">{name}</h1>
      {page.bio?.trim() ? (
        <p className="max-w-xs text-sm text-muted-foreground">{page.bio}</p>
      ) : null}
    </header>
  );
}
```

Nota: se usa `<img>` y no `next/image` porque el avatar es una URL arbitraria externa no configurada en `next.config`. El `eslint-disable` es intencional.

- [ ] **Step 3: `components/miselink/render/miselink-socials.tsx`**

```tsx
import { MISELINK_SOCIAL_NETWORKS } from "@/lib/mise-labels";
import type { SocialNetwork } from "@/lib/validations/miselink";
import type { RenderSocial } from "./types";

export function MiseLinkSocials({ socials }: { socials: RenderSocial[] }) {
  if (socials.length === 0) return null;
  return (
    <nav className="flex flex-wrap items-center justify-center gap-4">
      {socials.map((s) => {
        const meta = MISELINK_SOCIAL_NETWORKS[s.network as SocialNetwork];
        if (!meta) return null;
        const Icon = meta.icon;
        return (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={meta.label}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon className="h-5 w-5" />
          </a>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: `components/miselink/render/miselink-button.tsx`**

```tsx
import type { RenderItem } from "./types";

export function MiseLinkButton({ item }: { item: RenderItem }) {
  if (!item.url || !item.title) return null;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="block w-full rounded-2xl border border-border bg-card px-5 py-4 text-center text-sm font-medium text-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      {item.title}
    </a>
  );
}
```

- [ ] **Step 5: `components/miselink/render/miselink-public-view.tsx`**

```tsx
import { MiseLinkHeader } from "./miselink-header";
import { MiseLinkSocials } from "./miselink-socials";
import { MiseLinkButton } from "./miselink-button";
import type { RenderPage, RenderItem, RenderSocial } from "./types";

export function MiseLinkPublicView({
  page,
  items,
  socials,
}: {
  page: RenderPage;
  items: RenderItem[];
  socials: RenderSocial[];
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center gap-6 px-4 py-10">
      <MiseLinkHeader page={page} />
      <MiseLinkSocials socials={socials} />
      <div className="flex w-full flex-col gap-3">
        {items.map((item) => (
          <MiseLinkButton key={item.id} item={item} />
        ))}
      </div>
      <footer className="mt-auto pt-8 text-xs text-muted-foreground">
        <a href="/" className="hover:text-foreground">
          Hecho con MISE BY
        </a>
      </footer>
    </div>
  );
}
```

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/miselink/render
git commit -m "feat(miselink): componentes de render público"
```

---

## Task 8: Ruta pública `/{username}`

**Files:**
- Create: `app/(public)/[username]/page.tsx`
- Create: `app/(public)/[username]/error.tsx`
- Modify: `proxy.ts` (solo comentario)

**Interfaces:**
- Consumes: `getPublicPageByUsername`, `getOwnPageByUsername` de `lib/services/miselink.ts`; `getCurrentUser` de `lib/auth/session.ts`; `MiseLinkPublicView` de Task 7; `notFound` de `next/navigation`.

- [ ] **Step 1: `app/(public)/[username]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getPublicPageByUsername,
  getOwnPageByUsername,
  type MiseLinkPageWithRelations,
} from "@/lib/services/miselink";
import { MiseLinkPublicView } from "@/components/miselink/render/miselink-public-view";

type Params = { params: Promise<{ username: string }> };

async function resolvePage(username: string): Promise<{
  page: MiseLinkPageWithRelations;
  preview: boolean;
} | null> {
  const published = await getPublicPageByUsername(username);
  if (published) return { page: published, preview: false };

  const user = await getCurrentUser();
  if (!user) return null;
  const own = await getOwnPageByUsername(user.id, username);
  if (own) return { page: own, preview: true };
  return null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const resolved = await resolvePage(username).catch(() => null);
  if (!resolved) return { title: "Página no encontrada — MISE BY" };
  const { page } = resolved;
  const title = page.displayName?.trim() || `@${page.username}`;
  return {
    title: `${title} — MISE BY`,
    description: page.bio?.trim() || undefined,
    robots: resolved.preview ? { index: false, follow: false } : undefined,
  };
}

export default async function MiseLinkPublicPage({ params }: Params) {
  const { username } = await params;
  const resolved = await resolvePage(username);
  if (!resolved) notFound();

  const { page, preview } = resolved;
  const activeItems = preview ? page.items.filter((i) => i.active) : page.items;

  return (
    <div className="min-h-[100dvh] bg-background">
      {preview ? (
        <p className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
          Vista previa — esta página todavía no está publicada.
        </p>
      ) : null}
      <MiseLinkPublicView
        page={{
          username: page.username,
          displayName: page.displayName,
          bio: page.bio,
          avatarUrl: page.avatarUrl,
        }}
        items={activeItems.map((i) => ({ id: i.id, title: i.title, url: i.url }))}
        socials={page.socials.map((s) => ({ id: s.id, network: s.network, url: s.url }))}
      />
    </div>
  );
}
```

- [ ] **Step 2: `app/(public)/[username]/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MiseLinkError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[miselink public]", error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-sm text-muted-foreground">
        No pudimos cargar esta página. Probá de nuevo en un momento.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          Reintentar
        </button>
        <Link href="/" className="rounded-xl bg-[#075296] px-4 py-2 text-sm font-medium text-white">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Comentario en `proxy.ts`**

Justo encima de `export const config = {` agregar:

```ts
// Nota: las rutas públicas de MISE LINK (`/{username}`) pasan por este middleware
// pero no matchean ningún prefijo protegido ni PUBLIC_ONLY_PATHS, así que caen en
// NextResponse.next(). La colisión de nombres se previene con RESERVED_USERNAMES
// en lib/miselink/reserved-usernames.ts al reclamar el username.
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS. En el output de build, `/[username]` aparece como ruta dinámica.

- [ ] **Step 5: Commit**

```bash
git add "app/(public)/[username]" proxy.ts
git commit -m "feat(miselink): ruta pública /{username}"
```

---

## Task 9: Instalar @dnd-kit

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Instalar**

Run: `npm install @dnd-kit/core@^6 @dnd-kit/sortable@^8 @dnd-kit/utilities@^3`
Expected: instala sin errores de peer deps (el proyecto tiene `legacy-peer-deps=true` en `.npmrc`).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(miselink): agregar @dnd-kit para reordenar enlaces"
```

---

## Task 10: Hook de estado del editor

**Files:**
- Create: `hooks/use-miselink-state.ts`

**Interfaces:**
- Consumes: acciones de `lib/actions/miselink.ts` (Task 6); tipos Prisma `MiseLinkItem`, `MiseLinkSocial`.
- Produces: `useMiseLinkState(initial)` que devuelve:
  ```ts
  {
    page: { username: string; displayName: string | null; bio: string | null; avatarUrl: string | null; published: boolean };
    items: MiseLinkItem[];
    socials: MiseLinkSocial[];
    pending: boolean;
    addLink(input: { title: string; url: string }): Promise<boolean>;
    editLink(id: string, input: Partial<{ title: string; url: string; active: boolean }>): Promise<boolean>;
    removeLink(id: string): Promise<boolean>;
    reorder(ids: string[]): Promise<boolean>;
    addSocial(input: { network: string; url: string }): Promise<boolean>;
    removeSocial(id: string): Promise<boolean>;
    saveProfile(input: { displayName?: string; bio?: string; avatarUrl?: string }): Promise<boolean>;
    saveUsername(username: string): Promise<boolean>;
    setPublished(v: boolean): Promise<boolean>;
  }
  ```
  Cada método devuelve `true` si la acción fue `ok`, `false` si no (y ya mostró `toast.error`). `router.refresh()` tras éxito para re-sincronizar con el server.

- [ ] **Step 1: Crear `hooks/use-miselink-state.ts`**

```ts
"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { MiseLinkItem, MiseLinkSocial } from "@prisma/client";
import {
  createLinkAction,
  updateLinkAction,
  deleteLinkAction,
  reorderLinksAction,
  createSocialAction,
  deleteSocialAction,
  updateProfileAction,
  updateUsernameAction,
  setPublishedAction,
} from "@/lib/actions/miselink";

export type EditorPage = {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  published: boolean;
};

type Initial = {
  page: EditorPage;
  items: MiseLinkItem[];
  socials: MiseLinkSocial[];
};

export function useMiseLinkState(initial: Initial) {
  const router = useRouter();
  const [page, setPage] = useState(initial.page);
  const [items, setItems] = useState(initial.items);
  const [socials, setSocials] = useState(initial.socials);
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    async <T,>(
      fn: () => Promise<{ ok: true } | { ok: false; error: string } | ({ ok: true } & T)>,
      onOk?: () => void,
    ): Promise<boolean> => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      onOk?.();
      startTransition(() => router.refresh());
      return true;
    },
    [router],
  );

  return {
    page,
    items,
    socials,
    pending,

    addLink: (input: { title: string; url: string }) =>
      run(
        () => createLinkAction(input),
        () => toast.success("Enlace agregado"),
      ),

    editLink: (id: string, input: Partial<{ title: string; url: string; active: boolean }>) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...input } : i)));
      return run(() => updateLinkAction(id, input));
    },

    removeLink: (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return run(
        () => deleteLinkAction(id),
        () => toast.success("Enlace eliminado"),
      );
    },

    reorder: (ids: string[]) => {
      setItems((prev) => ids.map((id) => prev.find((i) => i.id === id)!).filter(Boolean));
      return run(() => reorderLinksAction({ ids }));
    },

    addSocial: (input: { network: string; url: string }) =>
      run(
        () => createSocialAction(input),
        () => toast.success("Red social agregada"),
      ),

    removeSocial: (id: string) => {
      setSocials((prev) => prev.filter((s) => s.id !== id));
      return run(() => deleteSocialAction(id));
    },

    saveProfile: (input: { displayName?: string; bio?: string; avatarUrl?: string }) => {
      setPage((p) => ({ ...p, ...input }));
      return run(
        () => updateProfileAction(input),
        () => toast.success("Perfil actualizado"),
      );
    },

    saveUsername: (username: string) =>
      run(
        () => updateUsernameAction(username),
        () => {
          setPage((p) => ({ ...p, username: username.toLowerCase() }));
          toast.success("Nombre actualizado");
        },
      ),

    setPublished: (v: boolean) =>
      run(
        () => setPublishedAction(v),
        () => {
          setPage((p) => ({ ...p, published: v }));
          toast.success(v ? "Página publicada" : "Página despublicada");
        },
      ),
  };
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add hooks/use-miselink-state.ts
git commit -m "feat(miselink): hook de estado del editor"
```

---

## Task 11: Tab de Enlaces + redes (drag-drop)

**Files:**
- Create: `components/miselink/editor/link-row.tsx`
- Create: `components/miselink/editor/links-tab.tsx`
- Create: `components/miselink/editor/socials-tab-section.tsx`

**Interfaces:**
- Consumes: `useMiseLinkState` return (Task 10); `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`; shadcn `Input`, `Switch`, `Button`, `AlertDialog`, `Select`; `MISELINK_SOCIAL_NETWORKS` de `lib/mise-labels.ts`; `SOCIAL_NETWORKS` de `lib/validations/miselink.ts`.
- Produces:
  - `<LinksTab state={ReturnType<typeof useMiseLinkState>} />`
  - `<SocialsTabSection state={...} />`
  - `<LinkRow item={MiseLinkItem} onEdit onRemove dragHandleProps />`

- [ ] **Step 1: `components/miselink/editor/link-row.tsx`**

```tsx
"use client";

import { useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import type { MiseLinkItem } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function LinkRow({
  item,
  onEdit,
  onRemove,
  dragHandleProps,
}: {
  item: MiseLinkItem;
  onEdit: (input: Partial<{ title: string; url: string; active: boolean }>) => void;
  onRemove: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const [title, setTitle] = useState(item.title ?? "");
  const [url, setUrl] = useState(item.url ?? "");

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
      <button
        type="button"
        aria-label="Reordenar"
        className="cursor-grab touch-none text-muted-foreground"
        {...dragHandleProps}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex flex-1 flex-col gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title !== item.title && title.trim() && onEdit({ title: title.trim() })}
          placeholder="Título"
          className="h-8 rounded-lg"
        />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => url !== item.url && url.trim() && onEdit({ url: url.trim() })}
          placeholder="https://..."
          inputMode="url"
          className="h-8 rounded-lg text-xs"
        />
      </div>

      <Switch
        checked={item.active}
        onCheckedChange={(v) => onEdit({ active: v })}
        aria-label="Activar enlace"
      />

      <AlertDialog>
        <AlertDialogTrigger
          aria-label="Eliminar enlace"
          className="text-muted-foreground hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este enlace?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onRemove}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

- [ ] **Step 2: `components/miselink/editor/links-tab.tsx`**

```tsx
"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import type { MiseLinkItem } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";
import { LinkRow } from "./link-row";
import { SocialsTabSection } from "./socials-tab-section";

type State = ReturnType<typeof useMiseLinkState>;

function SortableLinkRow({
  item,
  state,
}: {
  item: MiseLinkItem;
  state: State;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      <LinkRow
        item={item}
        onEdit={(input) => state.editLink(item.id, input)}
        onRemove={() => state.removeLink(item.id)}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function LinksTab({ state }: { state: State }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = state.items.map((i) => i.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    void state.reorder(next);
  };

  const submit = async () => {
    if (!title.trim() || !url.trim()) return;
    setAdding(true);
    const ok = await state.addLink({ title: title.trim(), url: url.trim() });
    setAdding(false);
    if (ok) {
      setTitle("");
      setUrl("");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="rounded-2xl border border-dashed border-border p-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del enlace" className="rounded-lg" />
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." inputMode="url" className="rounded-lg" />
            <Button onClick={submit} disabled={adding || !title.trim() || !url.trim()} className="shrink-0 gap-1 rounded-lg">
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>
        </div>

        {state.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Todavía no agregaste enlaces.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={state.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {state.items.map((item) => (
                  <SortableLinkRow key={item.id} item={item} state={state} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <SocialsTabSection state={state} />
    </div>
  );
}
```

- [ ] **Step 3: `components/miselink/editor/socials-tab-section.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MISELINK_SOCIAL_NETWORKS } from "@/lib/mise-labels";
import { SOCIAL_NETWORKS, type SocialNetwork } from "@/lib/validations/miselink";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";

type State = ReturnType<typeof useMiseLinkState>;

export function SocialsTabSection({ state }: { state: State }) {
  const [network, setNetwork] = useState<SocialNetwork>("instagram");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const submit = async () => {
    if (!url.trim()) return;
    setAdding(true);
    const ok = await state.addSocial({ network, url: url.trim() });
    setAdding(false);
    if (ok) setUrl("");
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Redes sociales</h3>

      <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-border p-3 sm:flex-row">
        <Select value={network} onValueChange={(v) => setNetwork(v as SocialNetwork)}>
          <SelectTrigger className="w-full rounded-lg sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOCIAL_NETWORKS.map((n) => (
              <SelectItem key={n} value={n}>
                {MISELINK_SOCIAL_NETWORKS[n].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." inputMode="url" className="rounded-lg" />
        <Button onClick={submit} disabled={adding || !url.trim()} className="shrink-0 gap-1 rounded-lg">
          <Plus className="h-4 w-4" /> Agregar
        </Button>
      </div>

      {state.socials.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {state.socials.map((s) => {
            const meta = MISELINK_SOCIAL_NETWORKS[s.network as SocialNetwork];
            const Icon = meta?.icon;
            return (
              <li key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm">
                {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
                <span className="w-24 shrink-0 text-muted-foreground">{meta?.label ?? s.network}</span>
                <span className="flex-1 truncate text-xs">{s.url}</span>
                <button
                  type="button"
                  aria-label="Eliminar red social"
                  onClick={() => state.removeSocial(s.id)}
                  className="text-muted-foreground hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Verificar que existe `components/ui/select.tsx`**

Run: `ls components/ui/select.tsx`
Expected: existe (visto en el árbol). Si no, `npx shadcn@latest add select`.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/miselink/editor/link-row.tsx components/miselink/editor/links-tab.tsx components/miselink/editor/socials-tab-section.tsx
git commit -m "feat(miselink): tab de enlaces y redes con drag-drop"
```

---

## Task 12: Tabs de Perfil y Ajustes

**Files:**
- Create: `components/miselink/editor/profile-tab.tsx`
- Create: `components/miselink/editor/settings-tab.tsx`

**Interfaces:**
- Consumes: `useMiseLinkState` return; `react-hook-form` + `zodResolver`; `profileSchema`, `usernameSchema` de Task 3; shadcn `Input`, `Field*`, `Button`, `Switch`, `Textarea`.
- Produces: `<ProfileTab state={...} />`, `<SettingsTab state={...} baseUrl="miseby.com" />`

- [ ] **Step 1: `components/miselink/editor/profile-tab.tsx`**

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { profileSchema, type ProfileInput } from "@/lib/validations/miselink";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";

type State = ReturnType<typeof useMiseLinkState>;

export function ProfileTab({ state }: { state: State }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: state.page.displayName ?? "",
      bio: state.page.bio ?? "",
      avatarUrl: state.page.avatarUrl ?? "",
    },
  });

  const bio = watch("bio") ?? "";

  const onSubmit = async (values: ProfileInput) => {
    await state.saveProfile({
      displayName: values.displayName?.trim() || undefined,
      bio: values.bio?.trim() || undefined,
      avatarUrl: values.avatarUrl?.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-5">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.displayName)}>
          <FieldLabel htmlFor="displayName">Nombre para mostrar</FieldLabel>
          <Input id="displayName" className="rounded-xl" {...register("displayName")} />
          {errors.displayName && <FieldError errors={[{ message: errors.displayName.message }]} />}
        </Field>

        <Field data-invalid={Boolean(errors.bio)}>
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea id="bio" rows={3} className="rounded-xl" {...register("bio")} />
          <span className="text-xs text-muted-foreground">{bio.length}/200</span>
          {errors.bio && <FieldError errors={[{ message: errors.bio.message }]} />}
        </Field>

        <Field data-invalid={Boolean(errors.avatarUrl)}>
          <FieldLabel htmlFor="avatarUrl">URL de la foto de perfil</FieldLabel>
          <Input id="avatarUrl" inputMode="url" placeholder="https://..." className="rounded-xl" {...register("avatarUrl")} />
          {errors.avatarUrl && <FieldError errors={[{ message: errors.avatarUrl.message }]} />}
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting} className="gap-2 rounded-xl bg-[#075296] text-white hover:bg-[#0E88E2]">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Guardar
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Verificar `components/ui/textarea.tsx`**

Run: `ls components/ui/textarea.tsx`
Expected: existe (visto en el árbol).

- [ ] **Step 3: `components/miselink/editor/settings-tab.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { usernameSchema } from "@/lib/validations/miselink";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";

type State = ReturnType<typeof useMiseLinkState>;

export function SettingsTab({ state, baseUrl = "miseby.com" }: { state: State; baseUrl?: string }) {
  const [username, setUsername] = useState(state.page.username);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = `${baseUrl}/${state.page.username}`;

  const saveUsername = async () => {
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Nombre inválido");
      return;
    }
    setError("");
    setSaving(true);
    await state.saveUsername(parsed.data);
    setSaving(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${publicUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="username">Tu dirección</FieldLabel>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{baseUrl}/</span>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-xl"
          />
          <Button onClick={saveUsername} disabled={saving} variant="outline" className="shrink-0 rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </div>
        {error && <FieldError errors={[{ message: error }]} />}
      </Field>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-medium">Publicar página</p>
          <p className="text-xs text-muted-foreground">
            {state.page.published ? "Tu página está online." : "Sólo vos podés verla."}
          </p>
        </div>
        <Switch
          checked={state.page.published}
          onCheckedChange={(v) => state.setPublished(v)}
          aria-label="Publicar página"
        />
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 p-3">
        <span className="flex-1 truncate text-sm">{publicUrl}</span>
        <Button onClick={copy} variant="ghost" size="sm" className="gap-1">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/miselink/editor/profile-tab.tsx components/miselink/editor/settings-tab.tsx
git commit -m "feat(miselink): tabs de perfil y ajustes"
```

---

## Task 13: Orquestador del editor + preview

**Files:**
- Create: `components/miselink/editor/miselink-editor.tsx`
- Create: `components/miselink/editor/no-plan-state.tsx`

**Interfaces:**
- Consumes: `useMiseLinkState`; `LinksTab`, `ProfileTab`, `SettingsTab`; `MiseLinkPublicView` de Task 7; shadcn `Tabs`.
- Produces:
  - `<MiseLinkEditor initial={Initial} />` (client) — `Initial` = mismo shape que consume `useMiseLinkState`.
  - `<NoPlanState />` (server-safe).

- [ ] **Step 1: `components/miselink/editor/no-plan-state.tsx`**

```tsx
import { Link2 } from "lucide-react";

export function NoPlanState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
      <div className="mx-auto mb-4 w-fit rounded-xl bg-[#075296]/10 p-3">
        <Link2 className="h-6 w-6 text-[#075296]" />
      </div>
      <p className="text-sm font-medium text-foreground">MISE LINK no está activo</p>
      <p className="mt-1 text-xs">
        Tu negocio todavía no tiene el plan MISE LINK activo. Contactá a soporte.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: `components/miselink/editor/miselink-editor.tsx`**

```tsx
"use client";

import type { MiseLinkItem, MiseLinkSocial } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMiseLinkState, type EditorPage } from "@/hooks/use-miselink-state";
import { MiseLinkPublicView } from "@/components/miselink/render/miselink-public-view";
import { LinksTab } from "./links-tab";
import { ProfileTab } from "./profile-tab";
import { SettingsTab } from "./settings-tab";

export function MiseLinkEditor({
  initial,
}: {
  initial: { page: EditorPage; items: MiseLinkItem[]; socials: MiseLinkSocial[] };
}) {
  const state = useMiseLinkState(initial);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <Tabs defaultValue="links">
          <TabsList>
            <TabsTrigger value="links">Enlaces</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="settings">Ajustes</TabsTrigger>
          </TabsList>
          <TabsContent value="links" className="mt-6">
            <LinksTab state={state} />
          </TabsContent>
          <TabsContent value="profile" className="mt-6">
            <ProfileTab state={state} />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <SettingsTab state={state} />
          </TabsContent>
        </Tabs>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-6 overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
          <div className="max-h-[70vh] overflow-y-auto">
            <MiseLinkPublicView
              page={{
                username: state.page.username,
                displayName: state.page.displayName,
                bio: state.page.bio,
                avatarUrl: state.page.avatarUrl,
              }}
              items={state.items
                .filter((i) => i.active)
                .map((i) => ({ id: i.id, title: i.title, url: i.url }))}
              socials={state.socials.map((s) => ({ id: s.id, network: s.network, url: s.url }))}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
```

- [ ] **Step 3: Verificar `components/ui/tabs.tsx`**

Run: `ls components/ui/tabs.tsx`
Expected: existe.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/miselink/editor/miselink-editor.tsx components/miselink/editor/no-plan-state.tsx
git commit -m "feat(miselink): orquestador del editor con preview en vivo"
```

---

## Task 14: Página del dashboard + sidebar

**Files:**
- Modify: `app/(business)/dashboard/miselink/page.tsx`
- Modify: `components/business/business-header.tsx`

**Interfaces:**
- Consumes: `getOrCreateMiseLinkPage` de Task 5; `MiseLinkEditor`, `NoPlanState` de Task 13; `getCurrentUser`.

- [ ] **Step 1: Reemplazar `app/(business)/dashboard/miselink/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrCreateMiseLinkPage } from "@/lib/services/miselink";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { MiseLinkEditor } from "@/components/miselink/editor/miselink-editor";
import { NoPlanState } from "@/components/miselink/editor/no-plan-state";

export const metadata: Metadata = {
  title: "MISE LINK — MISE BY",
  description: "Panel MISE LINK del negocio.",
};

export default async function MiseLinkDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  let editor: React.ReactNode;
  try {
    const page = await getOrCreateMiseLinkPage(user.id);
    editor = (
      <MiseLinkEditor
        initial={{
          page: {
            username: page.username,
            displayName: page.displayName,
            bio: page.bio,
            avatarUrl: page.avatarUrl,
            published: page.published,
          },
          items: page.items,
          socials: page.socials,
        }}
      />
    );
  } catch (e) {
    console.error("[miselink dashboard]", e);
    editor = <NoPlanState />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <BusinessHeader userLabel={user.email} />
      <div className="flex flex-1">
        <BusinessSidebar />
        <main className="flex-1 p-6 lg:p-10">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-semibold text-foreground">MISE LINK</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu página de enlaces pública.
            </p>
          </div>
          {editor}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Agregar item de nav en `components/business/business-header.tsx`**

En `BusinessSidebar`, reemplazar el `<nav>` actual por (mantener el import de `Building2`, agregar `Link2` y `Link` de `next/link`):

```tsx
import Link from "next/link";
import { Building2, Link2 } from "lucide-react";
// ...
      <nav className="mt-2 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <Building2 className="h-4 w-4" />
          Inicio
        </Link>
        <Link
          href="/dashboard/miselink"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <Link2 className="h-4 w-4" />
          MISE LINK
        </Link>
      </nav>
```

(Fase 1 no resalta el item activo; se puede agregar con `usePathname` en una fase posterior si se convierte el sidebar en client component.)

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "app/(business)/dashboard/miselink/page.tsx" components/business/business-header.tsx
git commit -m "feat(miselink): página del dashboard + item de sidebar"
```

---

## Task 15: Verificación end-to-end

**Files:** ninguno (sólo verificación).

**Precondición:** la migración de Task 1 se aplicó (con OK del usuario). Si no, PARAR y pedirlo ahora.

- [ ] **Step 1: Datos de prueba**

Confirmar que existe un usuario `business_owner` con Organization y membership `mise_link` en estado `active` o `trial`. Si no, pedir al usuario que lo cree desde el panel `/control` o vía seed. Anotar credenciales desde `docs/CREDENTIALS.md`.

- [ ] **Step 2: Levantar la app**

Run: `npm run dev`
Abrir `http://localhost:3000/login`, entrar con el usuario business.

- [ ] **Step 3: Editor**

Ir a `/dashboard/miselink`. Verificar:
- Carga el editor (no `NoPlanState`).
- Preview a la derecha muestra `@username` y "Hecho con MISE BY".

- [ ] **Step 4: Enlaces**

- Agregar 2 enlaces (título + URL válida). Aparecen en la lista y en el preview.
- Editar el título de uno (blur) → toast, preview actualiza tras refresh.
- Arrastrar para reordenar → el orden persiste tras recargar la página.
- Desactivar un enlace con el switch → desaparece del preview.
- Eliminar un enlace → diálogo de confirmación → se va.

- [ ] **Step 5: Redes**

Agregar una red (Instagram + URL). Aparece icono en el preview. Eliminarla.

- [ ] **Step 6: Perfil**

Cargar nombre, bio (probar > 200 chars → error de validación), avatar URL. Guardar → preview refleja.

- [ ] **Step 7: Ajustes + publicación**

- Intentar publicar sin enlaces activos → error "Agregá al menos un enlace activo antes de publicar".
- Activar un enlace, publicar → toast OK.
- Cambiar username a uno reservado (`api`) → error.
- Cambiar a un username válido nuevo → OK, la URL mostrada cambia.
- Botón copiar → copia `https://miseby.com/<username>`.

- [ ] **Step 8: Página pública**

- En ventana incógnito, abrir `http://localhost:3000/<username>`:
  - Antes de publicar → 404.
  - Después de publicar → se ve el perfil, enlaces activos, redes, footer.
- Con el username sin publicar, logueado como dueño → banner "Vista previa".
- Abrir `http://localhost:3000/login` → sigue funcionando (no lo tapa `[username]`).

- [ ] **Step 9: Build final**

Run: `npm run build && npm run lint`
Expected: ambos PASS.

- [ ] **Step 10: Commit final (si hubo ajustes)**

```bash
git add -A
git commit -m "test(miselink): verificación e2e fase 1"
```

---

## Self-Review

**Spec coverage:**
- Schema (`MiseLinkPage`/`Item`/`Social`, campos futuros incluidos) → Task 1. ✅
- Decisión username (dedicado en `MiseLinkPage`, sugerido desde `org.slug`) → Task 1 + Task 5 `generateUniqueUsername`. ✅
- Palabras reservadas → Task 2, usadas en Task 3 (validación) y Task 5 (unicidad). ✅
- Validaciones zod + check script → Task 3. ✅
- Ruta pública `app/(public)/[username]` + 404 + preview dueño + `generateMetadata` + `error.tsx` → Task 8. ✅
- `proxy.ts` sin cambios funcionales (solo comentario) → Task 8 Step 3. ✅
- Servicio con todas las funciones del spec → Task 5. ✅
- Server Actions patrón `ActionResult` + `revalidatePath` → Task 6. ✅
- Editor: tabs Enlaces/Perfil/Ajustes + preview en vivo + drag-drop `@dnd-kit` → Tasks 9–13. ✅
- Componentes < 500 líneas, un archivo por responsabilidad → estructura de archivos. ✅
- Estado sin plan (`NoPlanState` reutiliza patrón de banner) → Task 13. ✅
- Item "MISE LINK" en sidebar → Task 14. ✅
- Feedback de error: `toast` + `console.error` → `fail()` en Task 6, `run()` en Task 10. ✅
- Testing: check script (Task 3) + verificación manual documentada (Task 15) + `npm run build`. ✅
- Uploads por URL pegada (no archivos) → `avatarUrl` es input de texto en Task 12. ✅
- Auditoría (`logAudit`) deliberadamente omitida en Fase 1 para no ampliar el enum `AuditAction` en la migración; se puede agregar en una fase posterior. Desvío documentado aquí.

**Placeholder scan:** sin `TBD`/`TODO`/"handle errors appropriately". Todo el código está escrito. ✅

**Type consistency:**
- `MiseLinkPageWithRelations` definido en Task 5, importado en Tasks 8 y 14. ✅
- `EditorPage` definido en Task 10, importado en Tasks 12–14. ✅
- `useMiseLinkState` return usado como `ReturnType<typeof useMiseLinkState>` en Tasks 11–13 — no se re-declara, se infiere. ✅
- `SocialNetwork` / `SOCIAL_NETWORKS` definidos en Task 3, usados en Tasks 4, 11. ✅
- `RenderPage`/`RenderItem`/`RenderSocial` definidos en Task 7, consumidos en Tasks 8, 13. ✅
- Acciones devuelven `ActionResult` (+`{ id? }` en create) — el `run()` helper de Task 10 tolera ambas formas. ✅
