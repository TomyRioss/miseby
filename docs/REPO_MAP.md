# REPO_MAP — miseby

Leer primero en cada task. Ir directo al archivo, sin fase de descubrimiento.

## Menú / Catálogo (editor)
- Header (banner + logo + nombre + tabs): `components/business/menu/menu-manager.tsx`
- Página menú: `app/(business)/dashboard/menu/page.tsx`
- Página catálogo: `app/(business)/dashboard/catalogo/page.tsx`
- Filas de categoría / drag&drop: `components/business/menu/menu-category-row.tsx`
- Hoja de producto (crear/editar): `components/business/menu/product-sheet.tsx`
- Textos según modo (restaurante vs comercio): `components/business/menu/menu-copy.ts`
- Managers viejos (productos/categorías): `components/business/restaurant/products-manager.tsx`, `categories-manager.tsx`

## Apariencia / Marca
- Form de apariencia (colores, nombre, logo): `components/business/restaurant/appearance-form.tsx`
- Página apariencia: `app/(business)/dashboard/apariencia/page.tsx`
- Preview teléfono en vivo: `components/business/restaurant/carta-phone-preview.tsx`
- Layout editor + preview: `components/business/restaurant/menu-editor-layout.tsx`
- Tema y tipos (`RestaurantAppearance`, etc.): `lib/restaurant-theme.ts`
- Persistencia del tema: `lib/services/miselink.ts`

## Server actions
- Menú + apariencia (`saveMenuAction`, `saveAppearanceAction`): `lib/actions/restaurant.ts`

## Shell del dashboard
- Header + sidebar: `components/business/business-header.tsx`
- Páginas: `app/(business)/dashboard/<seccion>/page.tsx` (negocio, clientes, mise-ia, miselink, analytics, productos, categorias)

## Público
- Menú público: `app/menu/[slug]/page.tsx`
- Catálogo público: `app/(public)/catalogo/[slug]/page.tsx`
- Vista pública restaurante: `components/business/restaurant/restaurant-public-view.tsx`
- Vista pública catálogo: `components/business/catalog/catalog-public-view.tsx`

## Auth / tenant
- Sesión: `lib/auth/session.ts`
- Organización del miembro: `lib/services/organizations.ts`
