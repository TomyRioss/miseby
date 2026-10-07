# Cuentas demo (solo dev local)

> Generadas por `prisma/seed.ts`. Correr: `npx prisma db seed` (idempotente;
> los usuarios existentes **no** se modifican: el seed solo crea lo que falta).

| Rol | Email | Entra a |
|-----|-------|---------|
| `platform_owner` | `owner@miseby.com` | `/control` |
| `business_owner` | `negocio@miseby.com` | `/dashboard` |
| `business_member` | `equipo@miseby.com` | `/dashboard` |
| `business_owner` | `tomy@gmail.com` | `/dashboard` (org **Tomy Demo**, plan **MISE LINK**) |

`business_owner` y `business_member` pertenecen a la organización **Negocio Demo** (`slug: negocio-demo`), con membresía plan **MISE** activa.

## Passwords

Nunca commitear passwords. Opciones:

1. Variables de entorno (recomendado para equipo):
   `SEED_DEMO_PASSWORD` (para owner/negocio/equipo) y `SEED_TOMY_PASSWORD`
   (para tomy@gmail.com). Solo aplican a cuentas **nuevas**.
2. Sin variables, el seed genera passwords aleatorios y los muestra **una vez**
   en la consola al correr. Anotalos ahí.
