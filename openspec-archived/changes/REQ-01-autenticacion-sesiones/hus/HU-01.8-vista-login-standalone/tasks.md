# HU-01.8 — Tasks técnicas

## T1 — Mockup `mockups/login.html`

- Crear archivo siguiendo el patrón de `mockups/forgot-password.html`
- Incluir todos los elementos: form, divider, AuthButtons visual-only, link a `/registro`, link a `/terminos`
- Sin `<script>` (es mockup estático)

## T2 — Componente `src/components/auth/AuthButtons.astro`

- Crear archivo con prop `mode` y `redirigirAcceso`
- 3 botones: Google (placeholder), Facebook (placeholder), Acceso Corporativo (link)
- Script interno (hidratación trivial) que wire los handlers
- Estilos en `src/styles/components.css`

## T3 — Helper `src/lib/client/ui/toast.ts`

- Función `mostrarToast(mensaje, tipo)`
- Crea contenedor si no existe
- Auto-remove a los 3.5s

## T4 — Helper `src/lib/client/auth/login.ts`

- `inicializarFormularioLogin()`
- `mostrarProximamente(provider)`
- Mapeo de errores HTTP a mensajes user-friendly

## T5 — Refactor `src/pages/iniciar-sesion.astro`

- Eliminar `<script>` inline con lógica
- Usar `<AuthButtons>` componente
- Si hay sesión → `Astro.redirect(redirigir)`
- Mantener comportamiento de query params

## T6 — Estilos `src/styles/pages/login.css`

- Crear archivo con clases de la vista
- Importar desde `BaseLayout.astro` condicionalmente o desde un layout específico

## T7 — Tests unit `tests/unit/client/auth/login.test.ts`

- Mock `fetch`, `window.location`, `document.getElementById`
- Verificar: form submit con 200 redirige, con 401 muestra error

## T8 — Test E2E `tests/e2e/auth-login-standalone.spec.ts`

- 6 escenarios según HU

## T9 — Verificación final de convenciones

```bash
# R1
grep -rn 'style="' src/pages src/components src/layouts
# esperado: 0 ocurrencias

# R2
grep -rn '<script>' src/pages src/components src/layouts
# esperado: solo imports + invocaciones de 1 línea
```

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde
- [ ] Sabotaje 1: comentar `inicializarFormularioLogin()` → form submit no hace nada → test E2E rojo → restaurar
- [ ] Sabotaje 2: cambiar `redirigirAcceso` default a `/otra-cosa` → test E2E "Acceso Corporativo" rojo → restaurar
- [ ] Sabotaje 3: comentar el `Astro.redirect` para usuarios autenticados → test E2E "ya autenticado" rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/client/auth/login.ts`
- [ ] Type check verde
- [ ] Cero `style="..."` inline
- [ ] PR mergeado a `develop`