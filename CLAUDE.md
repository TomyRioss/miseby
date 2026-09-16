@AGENTS.md

# Reglas de proyecto — instrucciones para Claude

## Regla base
- Siempre usar la skill `/cavemen ultra` junto a cada tarea (ahorro de tokens). En testeo/browser, acoplarla a Mimo v2.5 para maximizar el ahorro.

## Calidad obligatoria
- Errores siempre catcheados, con feedback de consola + feedback visual (UX/UI) correspondiente.
- OBLIGATORIO: antes de cambiar código o añadir una funcionalidad, revisar si ya existe una librería de terceros (instalada o instalable) que lo resuelva. Si existe, añadirla y usarla. Proponerla antes de escribir código propio.
- Para problemas desconocidos, buscar en internet y redes (Stack Overflow, Reddit, docs oficiales) antes de improvisar.
- Metodología MVC y componentes modulares.
- Nunca componentes de más de 500 líneas — modularizar si se supera.
- NUNCA crear imágenes o iconos en SVG. Usar solo fuentes reales (react-icons, Pexels, etc.).

## UI / Estilo
- Siempre usar shadcn para componentes prefabricados generales.
- Siempre usar TailwindCSS para estilos. Evitar CSS puro. Nunca tocar `global.css`.
- Siempre diseño responsivo mobile + desktop.

## Base de datos
- Siempre preguntar antes de hacer cambios en la DB. Solo actuar con consentimiento explícito del usuario en ese mensaje puntual.

## Marca — Mar Digital (sombrilla)
- Sistema unificado pixelado: píxel = unidad mínima digital/tecnológica, base retícula.
- Principios: claridad, equilibrio, proporción, alineación, consistencia, adaptabilidad digital.
- Área seguridad: espacio libre = forma píxel, sin interferencias.
- Atributos: modernidad, solidez, coherencia.
- Tipografía: respetar esencia original, disposición clara/equilibrada.
- Submarcas heredan píxel, diferencian por símbolo/color: Cripto amarillo-naranjado, Business verde, Holding morado (# hashtag), Creative logo principal + “Creative”.
- Colores base: blanco `#FFFFFF`, azul marino `#0A2540`. No inventar hex principal.
- UI: estética pixel sutil (retícula, detalles pixelados), Tailwind + shadcn.

## Skills por tarea
- **DB / Supabase:** skill `supabase/agent-skills`, modelo sonnet, junto al MCP de Supabase.
  - Ejemplos: "Help me set up Supabase Auth with Next.js" / "Help me add proper indexes to this table".
- **Testeo / navegador:** browser embebido en Orca, modelo Mimo v2.5, skill Dogfood, gasto mínimo de tokens.
- **Code review / auditoría:** skills `code-simplifier` y `code-reviewer`, modelo Mimo v2.5.
- **Commits / GitHub:** skills `commit-commands` y github mcp.
- **Componentes / diseño:** SIEMPRE `frontend design` skill + `impeccable` skill + `superpowers@claude-plugins-official` (skill `brainstorming` para pensar diseños) + `ui-ux-pro-max@ui-ux-pro-max-skill` + `expo-design`.
