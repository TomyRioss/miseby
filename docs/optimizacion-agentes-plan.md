# Plan de optimización: agentes ultra rápidos

## Diagnóstico (qué los hace lentos)
1. **Todo sincrónico**: una acción, después otra, después otra. Cada tool call espera un round-trip de Orca antes del siguiente. Esto es el 90% del problema.
2. **Exploración redundante**: el mismo grep con variantes mínimas, lecturas de 200 líneas para ubicar 10.
3. **Sin mapa del repo**: cada task redescubre dónde vive cada componente.
4. **Verificación pesada**: mismo nivel de evidencia para un cambio de 1 línea que para una feature.

No se tocan: modelos (ya son los más rápidos posibles), scopes ni funcionalidades. Solo velocidad.

## Plan
### 1. Paralelismo total (el punto fuerte)
- Regla: si hay N acciones independientes, se disparan las N juntas. Si hay que hacer 1000 acciones, se sueltan 1000 agentes. Nunca secuencial.
- Todo lo que no dependa del resultado de otra cosa va en el mismo bloque: greps, reads, logs, checks.
- Subagentes en abanico (`delegate_task` con todas las entries a la vez) para explorar, verificar y codear frentes independientes en paralelo.
- Lo único secuencial permitido: lo que genuinamente depende de un resultado anterior (leer un archivo antes de parcharlo, testear después de codear). Todo lo demás es abominable.

### 2. Búsqueda certera, no limitada
- Sin presupuesto de lecturas: con paralelismo el costo de explorar colapsa solo.
- 1 grep bien acotado (`--include="*.tsx"` + subdir del área) en vez de varios amplios; jamás `node_modules` ni el home entero.
- Lecturas alrededor del hit (40-60 líneas), no archivos completos de 200+.
- Prohibido repetir la misma búsqueda con variantes mínimas; si el primer hit sirve, se para.

### 3. Mapa del repo (pagar el costo una vez)
- `docs/REPO_MAP.md` por proyecto: ruta → qué vive ahí (ej. header del menú → `components/business/menu/menu-manager.tsx`).
- El agente lo lee primero y salta la fase de descubrimiento en el 80% de los tasks.

### 4. Verificación proporcional
- Fix chico: `tsc` + `eslint` a archivos tocados + boot de dev server. Sin screenshots salvo UI visible nueva.
- No re-verificar lo que el tool ya confirmó.

## Métrica
Tiempo pared por task y % de tool calls que fueron en bloque paralelo vs secuenciales. Objetivo: >80% de las llamadas independientes en paralelo. Si un fix chico tarda >3 minutos, falló el paralelismo, no el modelo.
