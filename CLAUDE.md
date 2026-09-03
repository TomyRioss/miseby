@AGENTS.md

# Reglas de proyecto

## Credenciales
- `docs/CREDENTIALS.md` tiene credenciales del proyecto — consultar ahí antes de pedirlas o inventarlas.

## Workflow
- Siempre usar skill `/cavemen ultra` (junto a la tarea, para ahorrar tokens).
- Antes de implementar algo: buscar si ya existe librería de terceros (instalada o instalable) que resuelva el problema. Si existe, proponerla antes de escribir código propio.
- Nunca hacer cambios en la base de datos sin consentimiento explícito del usuario en ese mensaje puntual.
- Metodología MVC, componentes modulares. Ningún componente mayor a 500 líneas — modularizar si se supera.
- Para problemas desconocidos, buscar en internet (Stack Overflow, Reddit, docs oficiales) antes de improvisar.

## UI / Estilo
- Errores siempre catcheados, con feedback visual (UX/UI) y de consola correspondiente.
- Usar shadcn para componentes prefabricados generales.
- Usar TailwindCSS para estilos. Evitar CSS puro. Nunca tocar `global.css`.
- Diseño responsivo siempre (mobile + desktop).
- Nunca usar SVG para imágenes/iconos salvo pedido explícito — usar fuentes reales (react-icons, Pexels, etc).

## Skills por tarea
- **DB / Supabase**: skill `supabase/agent-skills`, modelo sonnet, junto a MCP de Supabase.
- **Testing / navegador**: skill playwright, modelo haiku, mínimo gasto de tokens (combinar con `/cavemen ultra` para más ahorro).
- **Code review / auditoría**: skills `code-simplifier` y `code-reviewer`, modelo haiku.
- **Commits / GitHub**: skills `commit-commands` y GitHub MCP.
- **Componentes / diseño**: siempre `frontend design` skill + `impeccable` skill + `superpowers@claude-plugins-official` (brainstorming) + `ui-ux-pro-max@ui-ux-pro-max-skill` + `expo-design`.
