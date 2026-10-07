# Auditoría de seguridad — 2026-10-07

## Correcciones

- **Toma de cuentas por invitación:** aceptar una invitación ya no reemplaza la contraseña de una cuenta existente. Requiere sesión de esa cuenta o contraseña actual; rechaza cuentas suspendidas. Consumo transaccional y condicionado para impedir reutilización.
- **Autenticación y sesiones:** Google requiere correo verificado; eliminada vinculación peligrosa por email. Sesiones verifican estado, rol y huella de credenciales. Cambiar contraseña/email revoca sesiones previas. Contraseñas limitadas a 72 bytes para impedir truncamiento de bcrypt.
- **Recuperación de cuenta:** tokens almacenados como SHA-256; consumo atómico con vencimiento y uso único. Tokens y enlaces dejaron de aparecer en logs de correo e invitaciones.
- **Permisos:** acciones de negocio exigen organización activa. Eliminado cambio arbitrario de configuración de restaurante por el editor de tema. Padres de enlaces deben pertenecer a la página; ciclos y reordenamientos duplicados rechazados.
- **XSS:** JSON-LD escapa `<`; enlaces, redes e imágenes rechazan protocolos ejecutables, incluidos datos antiguos.
- **Exposición de información:** hashes de contraseña excluidos de datos de la tabla de usuarios. Costos, embalaje y SKU excluidos de productos públicos. Errores internos de persistencia no enviados directamente al cliente.
- **Pedidos:** precio calculado en servidor; variantes obligatorias, modificadores duplicados, selecciones inválidas, cantidades y desbordamientos rechazados.
- **Archivos:** JPEG/PNG/WebP decodificados y reconstruidos con Sharp, retirando metadatos y contenido adjunto. Límites de bytes/píxeles; MIME falso, archivos truncados y animaciones rechazados.
- **Abuso de APIs:** cuotas para autenticación, invitaciones, IA, pedidos y clics. Cuerpos HTTP limitados durante lectura; comprobación de origen. No se confía en encabezados IP arbitrarios.
- **Cabeceras:** protección de framing, MIME sniffing, referrer y capacidades del navegador; retirado encabezado identificador de Next.js.
- **Dependencias:** Next.js, Nodemailer, Sharp y herramientas vulnerables actualizados; CLI shadcn movida a dependencias de desarrollo.

## Verificación

- 29/29 pruebas de seguridad pasaron: cuentas e invitaciones con dependencias simuladas, tokens, sesiones, precios, URLs, datos públicos, cuotas, cuerpos HTTP y archivos reales generados localmente.
- TypeScript sin errores (`tsc --noEmit --incremental false`).
- ESLint sin errores en archivos modificados y nuevos de aplicación. Tests excluidos por configuración del proyecto.
- `git diff --check` sin errores de whitespace.
- `npm audit --omit=dev`: **0 vulnerabilidades conocidas**.
- Auditoría completa: **11 alertas altas de desarrollo**, frente a 25 alertas iniciales. No son once causas independientes.

## Pendientes y límites

- `braces` y sus dependientes de herramientas: sin parche publicado en la revisión. [Aviso oficial](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- `deepmerge-ts` vía herramientas Prisma: corrección requiere cambio de dependencias Prisma, excluido por instrucción del usuario. [Aviso oficial](https://github.com/advisories/GHSA-ggr8-5vv4-36mx).
- Cuotas son por proceso. Varias instancias requieren almacenamiento compartido para cuotas globales. `TRUSTED_CLIENT_IP_HEADER` solo debe configurarse si el proxy elimina y sobrescribe ese encabezado.
- No se ejecutaron comandos Prisma, migraciones ni operaciones sobre la base. No se verificaron flujos con persistencia real ni navegador; las pruebas de cuentas usan mocks. Esto no certifica ausencia de todas las fallas.
- Al desplegar, sesiones anteriores sin huella serán rechazadas y enlaces de recuperación antiguos deberán solicitarse nuevamente. SMTP debe estar configurado en producción.
- Validar sesiones ahora consulta el estado actual de la cuenta; considerar ese costo en capacidad y monitoreo.

## Referencias

- [Google en Auth.js](https://authjs.dev/reference/core/providers/google).
- [JSON-LD en Next.js](https://nextjs.org/docs/app/guides/json-ld).
- [Recuperación de contraseña — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
