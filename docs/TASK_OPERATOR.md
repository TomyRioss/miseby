# Task Operator — loop automático Linear → código

Corre cada 5 minutos vía automation de Orca. Objetivo: convertir tasks nuevas de Linear en trabajo terminado sin intervención humana, frenando en In Review.

## Alcance

- Equipo Linear: Tomyrios. Proyecto: Miseby. IGNORA otros proyectos (ej: hermes-web).
- Workspace: este repo.

## Reglas del repo (resumen operativo)

- Concreto y directo. Hacer solo lo pedido en el issue.
- Nunca tocar DB/prisma ni correr comandos de DB sin permiso explícito escrito en el propio issue.
- Nunca `git reset --hard`, nunca force push.
- Componentes de máximo 500 líneas. shadcn + Tailwind. No tocar `global.css`. Responsive mobile + desktop. Sin SVG salvo pedido explícito. Errores con feedback visual + consola.
- Nada a producción sin QA + Security + Swarm OK. PROHIBIDO deployar a producción o tocar Vercel prod. Merge a main permitido solo con gates verdes (tsc, build, tests/QA del issue).

## Estándar de títulos Linear

`[Label-funcionalidad] Sección | Módulo - Contenido`. El label representa la funcionalidad (ej: Mise-Restaurant). El título lleva `Sección | Módulo - Contenido` (ej: `Menú | Preview - La preview necesita ser más linda`).

## Loop (en orden)

1. Verifica acceso a Linear (lista equipos). Sin acceso: termina con error visible.
2. Lista issues en Backlog del proyecto Miseby, más viejos primero. Ignora los que tengan label `needs-human`.
3. Single-flight: lista issues en In Progress con label `auto`. Si hay alguno, termina sin hacer nada (otra corrida está trabajando).
4. Sin Backlog: termina en silencio.
5. Toma hasta 3 issues más viejos por corrida.
6. Por cada uno: agrega label `auto`, pasa a Todo, comenta `Tomada por Task Operator (<fecha UTC>). Pipeline iniciado.`
7. Normaliza el título al estándar de arriba (ajusta label + título si no cumplen).
8. Pasa a In Progress e implementa según el issue. Si falta spec, la defines breve en el primer comentario.
9. Merge a main permitido si gates verdes. Deploy a prod: PROHIBIDO.
10. Éxito: mueve a In Review y comenta resumen (qué cambió, archivos, cómo verificar).
11. Fallo: comenta `Intento N/5: <error breve>`. Si N<5 vuelve a Backlog (mantiene label `auto`). Si N=5: agrega label `needs-human`, comenta diagnóstico + último error, deja en Backlog.
12. N = cantidad de comentarios `Intento N/5` previos del operador en ese issue + 1.
13. Si el issue es ambiguo o riesgoso (auth, pagos, datos sensibles, DB, scope gigante): no lo implementes, coméntalo y pásalo a In Review para humano.

## Exclusión mutua (solo una corrida a la vez)

Capas en orden. Si cualquiera dice "hay otra corriendo", termina en silencio:

0. Precheck del scheduler (corre antes de encender el agente): si existe `%TEMP%\task-operator.lock` con antigüedad menor a 15 minutos, la corrida se saltea. Lo evalúa el precheck de la automation, no el agente.
1. Guardia Orca: ejecuta `orca automations runs --id f09b2866-8c85-4dcc-b826-84e5e4f28641` y si hay otra corrida en estado corriendo (empezada pero sin terminar), termina en silencio.
2. Lockfile del agente: al arrancar crea/sobrescribe `%TEMP%\task-operator.lock` con tu ID de corrida + timestamp UTC. Reescríbelo cada ~2 minutos mientras trabajas. Bórralo al terminar (éxito o fallo). Si mueres sin borrarlo, expira solo a los 15 minutos.
3. Claim atómico por issue: tomar = UNA sola llamada que pone In Progress + label `auto` + comentario `Tomada por Task Operator (<run-id>).` Después re-lee el issue: si hay otro claim con timestamp más viejo, el tuyo pierde, abandona ese issue sin tocarlo y pasa al siguiente (o termina).
4. Huérfanos: un issue en In Progress + `auto` sin actividad del operador en más de 30 minutos se considera abandonado: adóptalo (comenta adopción) o devuélvelo a Backlog.