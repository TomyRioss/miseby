# MISE-RESTAURANT — Inventario funcional (extraído del legacy)

> Fuente: `horizons-export-9f4d8695...zip` — monorepo legacy (`apps/web` Vite/React SPA + `apps/api` Express + `apps/pocketbase` PocketBase).
> Este doc es el **plan funcional** para el proyecto Linear `miseby` → producto **mise-restaurant**. Revisar antes de generar epics/issues en Linear.

---

## 0. Contexto / stack

| Capa | Legacy | Destino (este repo) |
|---|---|---|
| Frontend | Vite + React 18 SPA, React Router v7 | Next.js (ver `AGENTS.md`) |
| UI | shadcn/ui + Radix + Tailwind 3 + lucide + framer-motion + recharts + sonner | shadcn + Tailwind (igual) |
| Backend | Express API (`apps/api`) + PocketBase (SQLite, auth, storage, hooks) | Next API routes + Prisma/DB (ver `prisma/`) |
| Auth | PocketBase auth (users) + colección `admin_users` aparte | `auth.ts` (ya presente) |
| Pagos | Stripe Checkout + webhooks | Stripe |
| IA | Endpoint SSE `/integrated-ai/stream` (agente propio con tool `generate_image`) | por definir |
| i18n | `translations.js` ES/EN, `LanguageContext` | por definir |

Multi-tenant: 1 usuario → N `businesses`, `users.currentBusinessId` marca el activo. Todo filtra por `businessId`.

---

## 1. Modelo de datos (colecciones legacy)

- **users** (auth): email, password, `full_name`, `phone`, `whatsapp`, `country`, `currency`, `role`, `tenant_id`, `businessName`, `onboardingCompleted`, `currentBusinessId`, `verified`.
- **businesses**: `ownerId`, `businessName`, `businessType` (select), `description`, `phone`, `whatsapp`, `address`, `city`, `country`, `country_select`, `timezone`, `slug`, `status` (trial/active/grace_period/expired/cancelled), `social_media`, `hours` + visibilidad de horarios.
  - Suscripción: `plan` (basic/professional/premium), `subscription_status`, `subscription_start_date`, `subscription_end_date`, `trial_end_date`, `is_trial`, `trial_extended_count`, `billing_period` (monthly/annual), `currency` (USD/COP), `stripe_subscription_id`, `stripe_customer_id`, `last_payment_date`, `next_renewal_date`, `grace_period_end_date`, `subscription_cancelled_date`, `totalRevenue`.
- **business_branding**: `businessId`, `logo` (file), `coverImage` (file), `primaryColor`, `secondaryColor`, `backgroundColor`, `textColor`, `titleFont`, `bodyFont`, `socialMedia` (`{ links: [{ platform, url, username, show_link, show_catalog }] }`).
- **business_settings**: `businessId`, `currency`, `language`, `showPrices`, `showImages`, `showDescriptions`, `menuTemplate` (classic/navigable/premium).
- **categories**: `businessId`/`tenant_id`, `name`, `description`, `icon`, `order` / `display_order`.
- **products_v2**: `businessId`, `categoryId`, `name`, `description`, `price` (number), `image` (file), `available` (bool).
- **team_members**: `businessId`, miembro (colección presente, UI "en desarrollo").
- **mise_ia_config**: `businessId`, `whatToRecommend`, `customInstructions`, `isActive`.
- **mise_links** (linktree): `businessId`, `title`, `url`, `icon`, `color`, `customColor`, `order`, `active`.
- **menu_visits** (analytics): `businessId`, `visitorId`, `deviceType`, `browser`, `country`, `city`, `productsViewed`, `sessionDuration`, `bounce`, `referrer`, `visit_date`.
- **product_views**: `businessId`, `productId`, `visitorId`, `viewDuration`, `view_date`.
- **admin_users** (auth aparte): email, password, `name`, `role`.
- **payment_history / payments**: `businessId`, `amount`, `currency`, `status`, `created`.
- **temporary_users**: `email`, `temp_password`, `plan`, `trial_days`, `expires_at`, `created_by_admin`.
- **password_reset_tokens**: `userId`, `token` (+ hook de email).
- **audit_trail**: `action`, `userId`, `adminId`, `subject`, `template`, `createdAt`.
- **email_templates**: 7 registros semilla.
- **integrated_ai_messages** / **integrated_ai_images**: historial y assets del chat IA.

---

## 2. Epics y funcionalidades

### EPIC A — Auth y cuenta
- Registro (`POST /auth/register`): `businessName`, email, password, `country_select` (valida contra 195 ISO alpha-2), `currency_select` (COP|USD). Crea `user` + `business` con trial 30 días (`status=trial`, `is_trial`).
- Login / logout (PocketBase auth → migrar a `auth.ts`).
- Verificación de email (hook `users-send-verification`).
- Forgot password → `password_reset_tokens` + email con token; reset password page (`/auth/reset-password/:token`).
- Cambio de password desde Ajustes (valida actual, min 8, confirmación).
- `ProtectedRoute` (requiere login) y variante `requireOnboarding`.

### EPIC B — Onboarding
- Wizard 2 pasos (`/onboarding`):
  1. Info del negocio → crea/actualiza `businesses` + crea `business_branding`.
  2. Identidad visual → sube logo/cover a `business_branding`, marca `users.onboardingCompleted`.
- Validación de campos, `toast` de error/éxito, `authRefresh` al terminar.

### EPIC C — Dashboard shell
- `DashboardLayout` con sidebar responsive (drawer en mobile). Nav:
  Vista General · Mi Negocio · Categorías · Productos · Apariencia · Mise Link & QR · **Mise IA** (submenu: Configuración, Chat de Prueba) · Suscripción · Ajustes.
- Selector de negocio activo (`currentBusinessId`).
- Contador de trial / countdown component (`TrialCountdownComponent`).

### EPIC D — Vista General (Overview)
- Cards: categorías activas, productos, vistas del catálogo, plan actual.
- Acciones rápidas + estado del catálogo digital.

### EPIC E — Mi Negocio
- Imágenes de marca (logo ≤2MB, portada ≤5MB).
- Información básica: nombre, tipo, descripción.
- Contacto y ubicación: phone, whatsapp, address, city, country.
- Horarios de atención (`CompactSchedule` / `ScheduleDisplay` / `useSchedule` / `formatDays`) + visibilidad de horarios.
- Redes sociales y enlaces (`SocialMediaManager`, normalizados por hook PB).
- Persiste en `businesses` + `business_branding`.

### EPIC F — Apariencia
- Colores: primary, secondary, background, text (pickers).
- Tipografías: título y cuerpo.
- Preview. Persiste en `business_branding`.

### EPIC G — Categorías
- CRUD (`CreateCategoryModal`, `EditCategoryModal`, `DeleteCategoryConfirmation`).
- Reordenar (drag) → persiste `display_order` en batch.
- Muestra conteo de productos por categoría.

### EPIC H — Productos
- CRUD (`CreateProductModal`, `EditProductModal`, `DeleteProductConfirmation`).
- Campos: nombre, descripción, precio, imagen, disponible, categoría.
- Filtro por categoría. Formato de moneda según `business_settings`/`currencyHelper`.

### EPIC I — Menú digital público
- Rutas: `/menu/:businessSlug`, `/r/:slug`. Resuelve business por `slug`.
- 3 plantillas: **Classic**, **Navigable**, **Premium** (selección en settings, `MenuTemplateSelector`).
- Render: branding (colores/fuentes/logo/cover), categorías ordenadas, productos, precios/imágenes/descripciones según flags de `business_settings`.
- Footer con redes sociales (`MenuFooter`, `SocialLinksSection`).
- SEO con `react-helmet`. Estados loading/skeleton/error con retry.
- Tracking de visita y product-view (ver EPIC L).
- `ShareMenuModal` + `MenuPreviewSection` en dashboard (`/dashboard/menu`).

### EPIC J — Mise Link & QR
- Página `/dashboard/mise-link`: 3 enlaces (menú, linktree público, IA pública) con copiar-al-portapapeles y abrir.
- Generación y descarga de **QR** (canvas → PNG) para cada enlace. Página QR dedicada con branding.
- **Linktree público** (`/links/:businessSlug`, `LinktreeLinksPage`): lista `mise_links` activos ordenados, con icono/color; editable desde dashboard.

### EPIC K — Mise IA (asistente mesero)
- **Configuración** (`/dashboard/mise-ia-config`): `whatToRecommend`, `customInstructions`, `isActive` → `mise_ia_config`.
- **Chat de prueba** (`/dashboard/mise-ia-config/chat`): prueba interna del prompt.
- **Prompt dinámico** (`buildMiseIASystemPrompt`): inyecta datos del negocio, redes, menú real (categoría/nombre/desc/precio). Reglas: solo recomienda platos reales, no inventa, conversacional, responde en español.
- **Chat público** (`/miseai/:businessSlug`, `PublicMiseAIPage`, `PublicMiseAIPage`).
- **Backend IA**: `POST /integrated-ai/stream` — SSE (content/reasoning/tool_use/tool_result/usage/error/done), rate limit propio, subida de imágenes (jpeg/png/webp) a storage, historial (máx 60 msgs), tool `generate_image`.
- `FloatingChatBot` en landing (asistente de ventas "Mise Mar Assistant", prompt en `apps/api/src/constants/prompts.js`).
- Hooks: `use-integrated-ai`, `use-animated-text`; clientes `integratedAiClient.js`, `apiServerClient.js`.

### EPIC L — Analytics
- **Tracking** (público): `POST /analytics/track/visit`, `POST /analytics/track/product-view` (valida business/product).
- **Dashboard analytics** (`/dashboard/analytics`, `useAnalytics`): rangos 7D/30D/90D/Todo.
  - `GET /analytics` → page_views, unique_visitors, bounce_rate, avg_session_duration, top_products, device_breakdown, traffic_by_date.
  - `GET /analytics/visits` (serie diaria), `/products` (top con nombres), `/devices` (mobile/desktop/tablet %), `/hourly` (0-23h), `/geographic` (por país).
- Componentes: `AnalyticsDashboard`, `AnalyticsCard`, `ChartSkeleton`, `MetricCard` (recharts).

### EPIC M — Suscripciones y pagos (Stripe)
- Planes: **basic / professional / premium**; períodos monthly/annual; monedas USD y COP.
  - Precios legacy: basic 15USD/135 · 60kCOP/540k; pro 20/180 · 80k/720k; premium 30/270 · 120k/1.08M.
- `GET /stripe/publishable-key`.
- `POST /stripe/create-checkout-session`: elige `priceId` por plan+moneda(país)+período, crea Checkout Session, metadata `business_id`.
- `GET /stripe/session/:id`: estado del pago.
- `POST /stripe/webhook`: `payment_intent.succeeded` (activa sub, calcula end date), `customer.subscription.updated/deleted`, `invoice.payment_failed` (→ grace_period).
- Páginas: `/pricing`, `/checkout`, `/checkout/success`, `/checkout/cancel`, `/dashboard/billing` (plan actual + upgrade/downgrade).
- Trial 30 días; grace period; expiración.
- Hooks PB: `trial-welcome-email`, `trial-expiration-check`, `grace-period-expiration-check`, `payment-success-email`, `payment-failed-email`.
- Middleware `subscription-status` (bloquea features si expirado).

### EPIC N — Panel Admin (interno)
- Auth aparte (`admin_users`, `POST /admin/auth/login`, `AdminAuthContext`, `AdminProtectedRoute`).
- `/admin/dashboard` — `GET /admin/analytics`: totalUsers, active/trial/expired/grace, totalRevenue, revenueByPlan, revenueByCurrency, churnRate, renewalRate, userGrowthData, revenueData. Rango 7d/30d/90d/custom.
- `/admin/users` — `GET /admin/users` paginado + filtros (plan/status/currency/dateRange/search).
- `/admin/users/:id` — perfil completo + `payment_history`. Acciones:
  - `PATCH /users/:id/plan` (cambiar plan).
  - `POST /users/:id/extend-trial` (7/14/30 días).
  - `POST /users/:id/reset-password` (genera temporal).
  - `POST /admin/users/create-temporary` (usuario temporal 24/48/72h).
- `/admin/plans` — `GET /admin/plans/stats`: conteos/ingresos por plan, upcoming renewals, expired users, renewals del mes, renewal/churn rate.
- Emails: `POST /admin/email/send`, `POST /admin/email/send-bulk` (byPlan/byStatus), log en `audit_trail`.

### EPIC O — Landing / marketing
- `/` HomePage con secciones: Hero, Features (6), HowItWorks (3 pasos), Templates + carousel, DashboardPreview, Analytics showcase, CustomerView showcase, MenuBuilder showcase, Settings showcase, SocialProof, Testimonials, Trust, Why, UseCases carousel, FAQ, Pricing, CTA / FinalCTA. Header + Footer.
- `IPhoneMockupAnimation` / `MenuAnimationScreen` / `MiniaturizedDashboard`.
- `/pricing` página dedicada.
- FloatingChatBot (EPIC K).

### EPIC P — i18n
- `translations.js` (ES/EN) + `LanguageContext` + `useLanguage`. Default ES.
- `countryToCurrency.js`, `currencyHelper.js` (front + api), `formatDays.js`.
- `GET /geolocation`: detecta país/moneda/timezone desde `Accept-Language` + header `x-timezone` (CO→COP, resto→USD).

### EPIC Q — Infra / plataforma
- Middleware API: `helmet`, `cors` (CORS_ORIGIN), `morgan`, rate limit global + por-ruta (IA), `error` middleware, `pocketbase-auth`, `admin-auth`, `file-upload` (multer), `subscription-status`.
- Logger propio (`logger.js`), forwarder de logs.
- `health-check` (`GET /health`).
- Storage de archivos (logos, covers, imágenes de producto, imágenes IA).
- Emails transaccionales (mailer PB / SMTP): verificación, reset, trial welcome, trial expira, grace period, pago ok, pago fallido.
- Rutas legacy con redirect (`/login`→`/auth/login`, etc.).

---

## 3. Notas de migración (legacy → este repo)

- El legacy tiene **API Express separada** + PocketBase. Este repo es **Next.js** con `prisma/` y `auth.ts` → colapsar API en route handlers y auth propio.
- `products_v2` es la colección buena (había `products` viejo). Categorías usan a veces `tenant_id` y a veces `businessId` — unificar a `businessId`.
- `menuTemplate` vive en `business_settings`; branding en `business_branding`; settings de visibilidad (precios/imágenes/descripciones) también.
- IA: definir proveedor (el prompt prohíbe nombrar Anthropic/OpenAI de cara al usuario). Ver `docs/` de este repo para stack IA objetivo.
- Stripe price IDs vienen de env por plan/moneda/período (12 combinaciones).
- Team/`team_members`: colección existe pero UI "en desarrollo" → feature incompleta en legacy, decidir si entra en scope.
- `DesignPage` y `PublishPage` legacy = "Coming soon" (no implementadas).

---

## 4. Propuesta de estructura Linear (para aprobar)

Proyecto: **miseby** · Producto: mise-restaurant.

Epics sugeridos (= los de la sección 2): A Auth · B Onboarding · C Dashboard shell · D Overview · E Mi Negocio · F Apariencia · G Categorías · H Productos · I Menú público · J Mise Link & QR · K Mise IA · L Analytics · M Suscripciones/Stripe · N Admin · O Landing · P i18n · Q Infra.

**Pendiente de decisión antes de crear en Linear:**
1. ¿Scope v1 = paridad total con legacy, o subset? (ej. dejar Admin y Team para v2)
2. ¿Milestones/ciclos o solo labels por epic?
3. Proveedor de IA y alcance de Mise IA en v1.
4. ¿Se migran datos del `pb_data` legacy o arranca limpio?
