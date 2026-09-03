# Stack — miseby-sourcecode.zip

Monorepo (npm workspaces, `apps/*`), Node 22 (`.nvmrc`). NO es Next.js — es Vite SPA.

## Frontend (`apps/web`)
- **Build tool**: Vite 7
- **Framework UI**: React 18 (JSX, no TS — `jsconfig.json`)
- **Routing**: React Router DOM v7
- **Estilos**: Tailwind CSS 3 + `tailwindcss-animate`, PostCSS + Autoprefixer
- **Componentes UI**: shadcn/ui (style "new-york") sobre Radix UI (accordion, dialog, dropdown, select, tabs, tooltip, etc. — set completo)
- **Iconos**: lucide-react
- **Forms**: react-hook-form + @hookform/resolvers + zod (validación)
- **Animaciones**: framer-motion
- **Otros UI**: cmdk (command palette), vaul (drawer), sonner (toasts), embla-carousel-react, recharts (gráficos), react-day-picker, input-otp, react-resizable-panels, next-themes (dark mode)
- **Utilidades**: date-fns, clsx, class-variance-authority, tailwind-merge
- **Cliente backend**: `pocketbase` SDK v0.27
- **SEO**: react-helmet
- **Lint**: ESLint 9 (flat config) + plugins react/react-hooks/import
- **Deploy build**: `vite build` → `dist/apps/web`

## Backend (`apps/pocketbase`)
- **PocketBase** v0.39.8 (backend-as-a-service: SQLite + Auth + Realtime + Storage + Admin UI)
- **Hooks personalizados** en JS (`pb_hooks/*.pb.js`): mailer, dashboard externo, forwarder de logs, cuentas/organizaciones/invitaciones/registro/seguridad (multi-tenant tipo "organizations")
- **Migraciones**: `pb_migrations/*.js` (versionadas, incluye reset v3 y cambios de colecciones/superuser)
- Tipos generados: `database-types.d.ts`, `pb_data/types.d.ts`

## Herramientas del monorepo (raíz)
- **Package manager**: npm (workspaces)
- **Orquestación de scripts**: concurrently (corre web + pocketbase juntos)
- **Análisis de código muerto**: knip

## Notas para migración
- No hay Prisma ni SQL propio — la DB es SQLite manejada por PocketBase (archivo `pb_data/data.db`).
- No hay TypeScript en el frontend, solo JS/JSX.
- No hay Next.js: es SPA pura servida por Vite (`vite preview` en `start`).
