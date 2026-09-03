# MISE LINK — Fase 1 (Núcleo)

Fecha: 2026-09-03
Estado: aprobado para implementación

## Objetivo

Dashboard estilo Linktree para que un negocio con plan `mise_link` cree una
página pública de enlaces en `miseby.com/{username}`. Fase 1 = núcleo funcional
mínimo usable de punta a punta: reclamar username, editar links, iconos
sociales, publicar, y render público.

Fuera de alcance en Fase 1 (fases posteriores):
- Diseño custom (wallpaper, botones, fuentes, colores, presets) — Fase 2
- Bloques avanzados: headers, collections, layout Featured, thumbnails,
  programación — Fase 3
- Embeds, SEO dinámico, analytics con gráficos, lock con clave — Fase 4
- Subida de archivos de imagen (Fase 1 usa URL pegada)

## Contexto del proyecto

- Next.js 16.3.3 (App Router), React 19, Prisma 6 + Postgres (Supabase),
  next-auth v5 beta, Tailwind v4, shadcn, framer-motion, react-hook-form + zod,
  sonner.
- Patrón establecido: Server Actions en `lib/actions/`, lógica en
  `lib/services/` (con `import "server-only"`), validaciones zod en
  `lib/validations/`, guards en `lib/auth/guards.ts`, auditoría vía
  `logAudit()` en `lib/services/audit.ts`.
- `proxy.ts` (raíz) es el middleware de auth. Protege `/dashboard` y `/control`.
- `getOrganizationForMember(userId)` resuelve la Organization + membership
  activa de un usuario business.
- `app/(business)/dashboard/miselink/page.tsx` existe como placeholder — se
  reemplaza.
- `app/(public)/` es un route group con rutas estáticas (`/login`, `/register`,
  `/forgot-password`, `/reset-password`, `/invitaciones/[token]`).
- El dashboard de negocio hoy muestra `miseby.com/{org.slug}` como URL pública
  del negocio (`app/(business)/dashboard/page.tsx`). Ver "Decisión: username".

## Decisión: username

El usuario eligió "campo dedicado, separado de `Organization.slug`". El username
vive como `MiseLinkPage.username` (`@unique`), 1:1 con la Organization. No se
toca `Organization`. Al crear la `MiseLinkPage` se pre-rellena el username con
`org.slug` (si está libre) como sugerencia; el negocio puede cambiarlo.

Pendiente cosmético para Fase 2+: el dashboard de negocio muestra
`miseby.com/{org.slug}`; una vez exista `MiseLinkPage`, esa fila debería
mostrar el username real. No se aborda en Fase 1.

## Modelo de datos (Prisma)

Migración nueva. **No se ejecuta sin OK explícito del usuario en el momento.**

```prisma
enum MiseLinkItemType {
  link
  header      // reservado para Fase 3, no se usa en editor Fase 1
  collection  // idem
  embed       // idem
}

model MiseLinkPage {
  id             String  @id @default(uuid()) @db.Uuid
  organizationId String  @unique @map("organization_id") @db.Uuid
  username       String  @unique
  published      Boolean @default(false)

  displayName    String? @map("display_name")
  bio            String? @db.Text
  avatarUrl      String? @map("avatar_url")
  showFollowers  Boolean @default(false) @map("show_followers")

  theme          Json    @default("{}")  // Fase 2 lo puebla; Fase 1 lo deja {}

  metaTitle       String? @map("meta_title")
  metaDescription String? @map("meta_description")
  passwordHash    String? @map("password_hash")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
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
  data  Json    @default("{}")

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
  network  String                       // instagram | tiktok | youtube | x | facebook | spotify | website
  url      String
  position Int

  page MiseLinkPage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId, position])
  @@map("miselink_socials")
}
```

Se agrega la relación inversa `miselinkPage MiseLinkPage?` en `Organization`.

`MiseLinkClick` (analytics) se difiere a Fase 4. `clickCount` en el item se
deja en el schema pero Fase 1 no lo incrementa.

Campos declarados pero no usados por el editor de Fase 1 (`theme`, `metaTitle`,
`metaDescription`, `passwordHash`, `scheduled*`, `type != link`): se incluyen en
la migración ahora para no re-migrar en cada fase. El editor sólo expone lo de
Fase 1.

## Ruteo

### Página pública: `app/(public)/[username]/page.tsx`

- Server Component. `params.username`.
- Next resuelve rutas estáticas del group antes que `[username]`, así que
  `/login` etc. siguen ganando. Aun así el username se valida contra lista de
  reservadas al reclamarlo (defensa en profundidad).
- Carga `MiseLinkPage` por `username` con items (`active: true`, ordenados por
  `position`) y socials. Si no existe o `published === false` → `notFound()`
  (404). Excepción: si el visitante es el dueño autenticado de esa página, se
  permite ver el borrador con un banner "Vista previa — no publicada".
- `generateMetadata`: title = `displayName ?? username`, description = `bio`.
  (meta custom = Fase 4.)
- Render: avatar, displayName, bio, fila de iconos sociales, lista de botones de
  link. Footer "Hecho con MISE BY" enlazando a la home.
- Estilo Fase 1: un único tema por defecto con tokens Tailwind existentes
  (fondo `bg-background`, botones estilo `Button` variante outline/secondary,
  radios `rounded-2xl`). Sin configuración visual.
- Componentes de render en `components/miselink/render/` (compartidos con el
  preview del editor): `MiseLinkPublicView`, `MiseLinkHeader`, `MiseLinkSocials`,
  `MiseLinkButton`.

### `proxy.ts`

- **Sin cambios funcionales.** Verificado: `config.matcher` excluye sólo assets
  (`_next/static`, `_next/image`, `favicon.ico`, imágenes), así que `[username]`
  pasa por el middleware, pero la función `auth(...)` sólo redirige cuando
  `pathname` empieza con `/dashboard` o `/control`, o cuando está en
  `PUBLIC_ONLY_PATHS` — `[username]` no cae en ninguno → `NextResponse.next()`.
  Sólo se añade un comentario aclaratorio en `proxy.ts`.

### Palabras reservadas

`lib/miselink/reserved-usernames.ts` — export `RESERVED_USERNAMES: Set<string>`:
`login, register, forgot-password, reset-password, dashboard, control, api,
invitaciones, _next, favicon.ico, robots.txt, sitemap.xml, admin, static,
assets, public, u, miselink, mise, soporte, support, terms, privacy, legal`.
El validador de username rechaza cualquier valor en el set.

## Validaciones (`lib/validations/miselink.ts`)

```ts
export const usernameSchema = z.string()
  .trim().toLowerCase()
  .min(3, "Mínimo 3 caracteres")
  .max(30, "Máximo 30 caracteres")
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Solo letras, números y guiones")
  .refine((v) => !RESERVED_USERNAMES.has(v), "Ese nombre no está disponible");

export const profileSchema = z.object({
  displayName: z.string().trim().max(60).optional(),
  bio: z.string().trim().max(200).optional(),
  avatarUrl: z.string().url().max(2000).optional().or(z.literal("")),
  showFollowers: z.boolean().optional(), // Fase 1: input oculto, siempre false
});

export const linkItemSchema = z.object({
  title: z.string().trim().min(1, "Título requerido").max(100),
  url: z.string().url("URL inválida").max(2000),
  active: z.boolean().optional(),
});

export const socialSchema = z.object({
  network: z.enum(["instagram","tiktok","youtube","x","facebook","spotify","website"]),
  url: z.string().url().max(2000),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});
```

## Servicio (`lib/services/miselink.ts`)

`import "server-only"`. Todas las funciones reciben el `userId` del actor y
resuelven la `MiseLinkPage` vía Organization; lanzan `Error("No autorizado")` si
la page no pertenece a la org del usuario.

- `getOrCreateMiseLinkPage(userId)` — resuelve org con
  `getOrganizationForMember`; si no hay org o no hay membership `mise_link`
  activa → `Error`. Si no existe `MiseLinkPage`, la crea con
  `username = slug libre` (usa helper de unicidad tipo `generateUniqueSlug`
  pero sobre `miselink_pages.username` y saltando reservadas). Devuelve la page
  con items + socials.
- `getPublicPageByUsername(username)` — sin auth. Devuelve page publicada con
  items activos ordenados + socials, o `null`.
- `updateUsername(userId, username)` — valida disponibilidad (`@unique` +
  reservadas), actualiza, `logAudit("miselink_username_updated")`.
- `updateProfile(userId, data)` — displayName/bio/avatarUrl.
- `setPublished(userId, published)` — requiere al menos 1 item activo para
  publicar; si no, `Error("Agregá al menos un enlace antes de publicar")`.
- `createItem(userId, data)` — `position = max+1`.
- `updateItem(userId, itemId, data)` — title/url/active.
- `deleteItem(userId, itemId)`.
- `reorderItems(userId, ids)` — set `position` por índice, en transacción.
- `createSocial / updateSocial / deleteSocial / reorderSocials` — análogo.

## Server Actions (`lib/actions/miselink.ts`)

`"use server"`. Patrón idéntico a `lib/actions/organizations.ts`:
`type ActionResult = { ok: true } | { ok: false; error: string }`, guard
`requireBusinessUser()`, `safeParse`, try/catch, `revalidatePath`.

Acciones: `updateUsernameAction`, `updateProfileAction`, `setPublishedAction`,
`createLinkAction`, `updateLinkAction`, `deleteLinkAction`, `reorderLinksAction`,
`createSocialAction`, `deleteSocialAction`, `reorderSocialsAction`.

Cada una hace `revalidatePath("/dashboard/miselink")` y, si la page está
publicada, `revalidatePath("/" + page.username)`.

## Editor (dashboard)

`app/(business)/dashboard/miselink/page.tsx` (Server Component):
- `requireBusinessUser()` implícito por layout; carga
  `getOrCreateMiseLinkPage(user.id)`. Si tira `Error` (sin plan `mise_link`),
  render de estado vacío reutilizando el patrón de `NoMembershipBanner`.
- Pasa la data a `<MiseLinkEditor>` (client).

`components/miselink/editor/` (client, `"use client"`):
- `MiseLinkEditor` — layout 2 columnas: panel de edición (izq) + preview (der,
  sticky). El preview reusa `components/miselink/render/MiseLinkPublicView` con
  la data en vivo del estado local (optimista).
- Tabs (shadcn `Tabs`): **Enlaces** | **Perfil** | **Ajustes**.
  - **Enlaces**: `LinkList` con drag-drop (`@dnd-kit/core` +
    `@dnd-kit/sortable` — instalar). Cada fila: título editable inline, URL
    editable, `Switch` activo/inactivo, botón borrar (`AlertDialog` de
    confirmación). Botón "+ Agregar enlace" abre inputs. También `SocialList`
    (sección aparte, mismo patrón, sin drag en Fase 1 — orden por creación).
  - **Perfil**: form react-hook-form (displayName, bio con contador 200,
    avatarUrl con preview). `zodResolver(profileSchema)`.
  - **Ajustes**: input username con validación en vivo + estado de
    disponibilidad (debounce, llama `updateUsernameAction` al guardar). Toggle
    "Publicar" (`setPublishedAction`) con copy del error si falta un enlace.
    Muestra la URL final `miseby.com/{username}` con botón copiar.
- Feedback: `toast` de sonner en cada acción (éxito y error). Errores también
  `console.error`.
- Ningún componente supera 500 líneas — `MiseLinkEditor` orquesta, cada tab y
  cada lista es su propio archivo.

Sidebar del dashboard: `BusinessSidebar` hoy sólo tiene "Inicio". Se agrega
item "MISE LINK" → `/dashboard/miselink` (sólo visible si hay plan `mise_link`;
por simplicidad Fase 1 se muestra siempre y la página maneja el caso sin plan).

## Manejo de errores

- Acciones: nunca lanzan al cliente; devuelven `{ ok: false, error }`. El
  cliente muestra `toast.error(error)` y `console.error`.
- Servicio: lanza `Error` con mensaje en español; la acción lo captura.
- Página pública: `notFound()` para page inexistente/no publicada. Error de DB
  → dejar propagar al `error.tsx` del group (crear
  `app/(public)/[username]/error.tsx` mínimo con mensaje y botón reintentar).
- Reclamar username duplicado: `@unique` de Prisma tira `P2002`; el servicio lo
  traduce a `"Ese nombre ya está en uso"`.

## Testing

Proyecto no tiene runner configurado. Se agrega verificación mínima sin
framework: un script `lib/validations/miselink.check.ts` con `assert`,
ejecutable vía `npx tsx lib/validations/miselink.check.ts`, que valida:
usernames válidos pasan; reservados fallan; regex rechaza mayúsculas, espacios,
guion inicial/final; longitudes borde (2, 3, 30, 31).
- Verificación manual documentada en el plan: reclamar username → agregar 2
  links → reordenar → publicar → abrir `/{username}` en incógnito → 404 antes
  de publicar, visible después.
- `npm run build` debe pasar.
- `npx prisma validate` antes de generar la migración.

## Orden de implementación (resumen; el plan detallado lo hace writing-plans)

1. Schema Prisma + `prisma validate` (migración se aplica con OK explícito).
2. `lib/miselink/reserved-usernames.ts` + `lib/validations/miselink.ts` + check.
3. `lib/services/miselink.ts`.
4. `lib/actions/miselink.ts`.
5. `components/miselink/render/*` (vista pública compartida).
6. `app/(public)/[username]/page.tsx` + `error.tsx` + `not-found` implícito.
7. Instalar `@dnd-kit/core` `@dnd-kit/sortable` `@dnd-kit/utilities`.
8. `components/miselink/editor/*`.
9. Reemplazar `app/(business)/dashboard/miselink/page.tsx`.
10. Item "MISE LINK" en `BusinessSidebar`.
11. `npm run build` + verificación manual.
