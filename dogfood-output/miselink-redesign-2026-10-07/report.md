# Dogfood — MiseLink y Diseño

## Resumen

Se revisaron ambas pantallas sobre fixtures sintéticos en escritorio y móvil. Blanco y azul marino `#0A2540` dominan; la retícula usa el mismo marino con opacidad baja. No se enviaron acciones que lean o modifiquen datos persistidos.

## Cobertura

- Editor de Links y editor de Diseño a 1440 × 1000 y 390 × 844.
- Disposición de escritorio y apilado móvil; sin desborde horizontal.
- Vista previa pública visible en ambas pantallas; el tema guardado sigue intacto.
- Consola del navegador: 0 errores y 0 advertencias.
- `npx tsc --noEmit`: correcto tras retirar fixtures.

## No ejercitado

No se enviaron ediciones, alta/borrado/reordenamiento de links, publicación, guardado/descarte de tema ni acciones de compartir: las rutas reales acceden a datos persistidos. Los fixtures sintéticos fueron retirados.

## Capturas

- Links, escritorio: `MEDIA:./screenshots/desktop.png`
- Links, móvil: `MEDIA:./screenshots/mobile.png`
- Diseño, escritorio: `MEDIA:./screenshots/design-desktop.png`
- Diseño, móvil: `MEDIA:./screenshots/design-mobile.png`