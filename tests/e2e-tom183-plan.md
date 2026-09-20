# Plan de verificación — TOM-183: registro con plan + trial 14d + onboarding

> QA-PREP sin screenshots. Ejecutar cuando los agentes de implementación commiteen.
> Archivos objetivo: `components/auth/register-form.tsx`, `components/auth/login-form.tsx`,
> `lib/services/auth.ts`, `lib/validations/auth.ts`, `proxy.ts`, página/ruta de onboarding.

## Precondiciones
- Branch `fix/TOM-183-registro-plan-trial-onboarding`.
- Planes válidos conocidos (ej: `emprendedor`, `negocio`, `marca` — confirmar contra `lib/services/memberships.ts` / seed).
- Google OAuth deshabilitado por spec (botón ausente o `disabled` con tooltip).
- `npx tsc --noEmit` y `npx eslint` en archivos tocados en verde antes del E2E.

## Casos

### 1. Registro por cada plan crea Membership trial 14d
- Por cada `planCode` válido: POST/acción de registro con `{ name, email único, password ≥8, businessName, country, planCode }`.
- Verificar: respuesta ok → existe `Membership { organizationId, planCode, status: trial, trialEndsAt ≈ now+14d }`.
- Verificar: `trialEndsAt - trialStartedAt == 14 días` (± tolerancia de minutos).
- Verificar: usuario redirigido a login u onboarding según spec (no a dashboard directo sin onboarding).

### 2. Plan inválido rechazado
- Registro con `planCode: "plan_inexistente"` → error de validación (400 / `result.ok === false`), sin `UserProfile`, `Organization` ni `Membership` creados.
- Registro sin `planCode` → rechazado o cae al plan default **solo si la spec lo define**; si no, rechazado.
- Mensaje de error visible en el form (no solo consola).

### 3. Google deshabilitado
- En `/register` y `/login`: no hay botón funcional de Google (ausente o `disabled`).
- Si existe botón deshabilitado: tooltip/texto explica que no está disponible.
- Sin rutas `/api/auth/signin/google` accesibles ni links ocultos al provider.

### 4. Login redirige a onboarding si incompleto, a dashboard si completo
- Usuario nuevo (onboarding incompleto: `onboardingCompleted == false` / perfil sin datos requeridos) hace login → redirect a `/onboarding`.
- Usuario con onboarding completo → redirect a `/dashboard`.
- Acceso directo a `/dashboard` sin onboarding → `proxy.ts` redirige a `/onboarding`.
- Acceso directo a `/onboarding` ya completo → redirige a `/dashboard` (evitar loop).

### 5. Onboarding guarda y marca completo
- Completar formulario onboarding → datos persistidos (org/perfil) y flag `onboardingCompleted == true`.
- Re-login posterior va a `/dashboard`.
- Submit con campos requeridos vacíos → errores de validación inline, sin marcar completo.
- Doble submit / refresh durante guardado no duplica registros (idempotente o botón deshabilitado).

### 6. Responsive (375px + desktop)
- `/register`, `/login`, `/onboarding` a 375×667: sin scroll horizontal, CTA visible sin scroll excesivo, inputs usables.
- Desktop ≥1280: layout centrado, sin ruptura de cards.
- Selector de plan usable en mobile (cards apilables o select).

## Checks estáticos (ya ejecutados en QA-PREP, re-ejecutar post-implementación)
- `npx tsc --noEmit`
- `npx eslint components/auth/register-form.tsx components/auth/login-form.tsx lib/services/auth.ts lib/validations/auth.ts proxy.ts` (ajustar a archivos tocados reales según `git status`)

## Estado QA-PREP (2026-09-20)
- Plan creado en `tests/e2e-tom183-plan.md`. Implementación TOM-183 **en curso**
  (cambios sin commitear: `lib/validations/auth.ts` ya valida `planCode`
  `mise_link | mise | mise_restaurant` default `mise`; `lib/services/auth.ts`
  crea/asegura plan + trial; nuevo `lib/services/onboarding.ts`;
  `components/auth/register-form.tsx` consume `@/components/auth/plan-selector`).
- `npx tsc --noEmit` → **FALLA** (errores en `register-form.tsx`: mismatch de
  `Resolver` por `planCode` opcional vs requerido, y `PlanSlug` no exportado
  por `plan-selector`). El árbol cambió entre dos corridas (agentes editando
  en paralelo); re-verificar post-implementación.
- `npx eslint` en archivos tocados → **1 error**:
  `register-form.tsx:181 @next/next/no-html-link-for-pages` (`<a>` a `/login`,
  usar `<Link />`).
- E2E pendiente a que la implementación esté completa y los checks en verde.
  No se commiteó nada.
