# HU-01.9 — Tasks técnicas

## T1 — Mockup `mockups/register.html`

- Crear archivo siguiendo patrón de `mockups/login.html`
- Sin `<script>` (es mockup estático)
- Incluye icono puerta cerrada, mensaje, lista de 3 opciones, CTA a login

## T2 — Refactor `src/pages/registro.astro`

- Quitar el `<form>` completo y los inputs
- Eliminar el `<script>` inline (no hay lógica de form)
- Mostrar mensaje informativo + lista + CTA a `/iniciar-sesion`
- Si hay sesión → `Astro.redirect`
- Mantener query param `?redirigir=`

## T3 — Modificar endpoint `src/pages/api/v1/auth/registro.ts`

- Cambiar el handler POST para responder `410 Gone` con `{ error: "registro deshabilitado en esta fase" }`
- Agregar comentario explicando que está deprecated (referencia a HU-01.9)

## T4 — Tests E2E `tests/e2e/auth-registro-closed.spec.ts`

- 3 escenarios según HU

## T5 — Verificación de convenciones

```bash
# R1
grep -rn 'style="' src/pages/registro.astro
# esperado: 0

# R2
grep -n '<script>' src/pages/registro.astro
# esperado: 0 (o solo imports si lo necesita)
```

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde
- [ ] Sabotaje 1: cambiar el `Astro.redirect` por un render normal → test E2E "ya autenticado" rojo → restaurar
- [ ] Sabotaje 2: cambiar status code del endpoint a 200 → test E2E "410" rojo → restaurar
- [ ] Sabotaje 3: dejar el `<form>` viejo en la vista → test E2E "ve el mensaje, NO ve form" rojo → restaurar
- [ ] Type check verde
- [ ] Cero `style="..."` inline
- [ ] PR mergeado a `develop`