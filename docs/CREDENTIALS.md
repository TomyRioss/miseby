# Credenciales demo

> Solo entorno local/dev. Generadas por `prisma/seed.ts`.
> Correr: `npx prisma db seed` (idempotente, upsert por email).

| Rol | Email | Password | Entra a |
|-----|-------|----------|---------|
| `platform_owner` | `owner@miseby.com` | `Miseby2026!` | `/control` |
| `business_owner` | `negocio@miseby.com` | `Miseby2026!` | `/dashboard` |
| `business_member` | `equipo@miseby.com` | `Miseby2026!` | `/dashboard` |

`business_owner` y `business_member` pertenecen a la organización **Negocio Demo** (`slug: negocio-demo`), con membresía plan **MISE** activa.

Cambiar password: editar `DEMO_PASSWORD` en `prisma/seed.ts` y re-correr el seed.
