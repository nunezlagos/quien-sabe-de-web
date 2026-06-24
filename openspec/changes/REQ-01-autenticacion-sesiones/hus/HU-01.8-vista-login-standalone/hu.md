# HU-01.8 — Vista standalone `/iniciar-sesion` con CTA principal

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-01-autenticacion-sesiones

## Historia de usuario

**Como** visitante anónimo
**Quiero** una página dedicada `/iniciar-sesion`
**Para** iniciar sesión con email + contraseña cuando lo necesite (compartir link, bookmark, o llegar desde un email transaccional)

## Contexto

Actualmente la home `index.astro` tiene un modal de login con botones
Google/Facebook/Acceso Corporativo, pero **no tiene formulario de email
+ password propio**. La vista real existe en `src/pages/iniciar-sesion.astro`
pero falta refactorizarla para cumplir `openspec/CONVENTIONS.md` y
agregar los botones OAuth visual-only.

Esta HU define el contrato de la vista standalone y la refactoriza para
cumplir las reglas R1 (sin CSS inline), R2 (JS extraído) y R3
(componentes reutilizables).

## Mockup de referencia

- `mockups/login.html` (a crear en esta HU) — vista standalone con:
  - Header mínimo (logo + link "Volver al inicio")
  - Card centrada con form email + password
  - Botón principal "Iniciar sesión" (gradiente naranja)
  - Separador "O continúa con"
  - 3 botones OAuth visual-only: Google (placeholder), Facebook (placeholder), Acceso Corporativo → `/dashboard`
  - Link inferior "¿No tienes cuenta? Regístrate" → `/registro` (HU-01.9)
  - Texto legal "Al iniciar sesión aceptas las normas de convivencia"

## Criterios de aceptación (Gherkin)

### Escenario: Carga de la vista sin sesión
  Dado que NO hay cookie `session` válida
  Cuando visito `GET /iniciar-sesion`
  Entonces recibo status 200
  Y la página renderiza el form completo (todos los inputs visibles)
  Y los botones Google/Facebook tienen atributo `aria-disabled="true"` y tooltip "Próximamente"
  Y el botón "Acceso Corporativo" linkea a `/dashboard`

### Escenario: Submit con credenciales válidas
  Dado que el form tiene email `vecino@demo.cl` y password `Demo1234`
  Cuando envío el form
  Entonces se hace `POST /api/v1/auth/iniciar-sesion`
  Y en éxito, redirige a `/dashboard` (o `?redirigir=` query param si existe)
  Y se setea cookie `session`

### Escenario: Submit con credenciales inválidas
  Dado que el form tiene credenciales incorrectas
  Cuando envío el form
  Entonces se muestra mensaje inline "Credenciales inválidas. Revisa tu correo y contraseña."
  Y NO se redirige

### Escenario: Submit con cuenta deshabilitada
  Dado un usuario con `status="banned"`
  Cuando envío el form con sus credenciales
  Entonces se muestra mensaje inline "Tu cuenta está deshabilitada. Contacta a soporte."

### Escenario: Click en "Continuar con Google"
  Cuando el usuario hace click en el botón
  Entonces se muestra un toast "Próximamente — en esta demo solo email + contraseña"
  Y NO hay redirección

### Escenario: Click en "Acceso Corporativo"
  Cuando el usuario hace click
  Entonces se redirige a `/dashboard`

### Escenario: Query param `redirigir`
  Dado que visito `/iniciar-sesion?redirigir=/p/juan-gasfiter`
  Cuando envío credenciales válidas
  Entonces se redirige a `/p/juan-gasfiter` en vez de `/dashboard`

### Escenario: Query param `error`
  Dado que visito `/iniciar-sesion?error=sesion-expirada`
  Entonces se muestra banner rojo arriba del form con ese texto

### Escenario: Ya autenticado redirige
  Dado que tengo cookie `session` válida
  Cuando visito `/iniciar-sesion`
  Entonces se redirige a `/dashboard` (no muestro el form a un usuario ya logueado)

## Tareas técnicas

- [ ] Mockup `mockups/login.html` siguiendo el patrón visual de `mockups/forgot-password.html` y `mockups/reset-password.html`
- [ ] Componente `src/components/auth/AuthButtons.astro` con prop `mode: "compact" | "full"` (reutilizable en modal de `index.astro` + vista `/iniciar-sesion`)
- [ ] Helper cliente `src/lib/client/auth/login.ts` con:
  - `inicializarFormularioLogin()`
  - `mostrarErroresLogin(mensajes: string[])`
  - `mostrarProximamente(provider: string)`
- [ ] Helper cliente `src/lib/client/ui/toast.ts` con `mostrarToast(mensaje: string, tipo: 'info' | 'error' | 'success')` (reutilizable)
- [ ] Refactorizar `src/pages/iniciar-sesion.astro`:
  - Sin `style="..."` inline (R1)
  - `<script>` inline solo importa `inicializarFormularioLogin` (R2)
  - Usa `<AuthButtons>` componente (R3)
  - Mantiene comportamiento actual de query params `redirigir` y `error`
  - Si ya hay sesión → redirige a `/dashboard`
- [ ] Estilos de la vista en `src/styles/pages/login.css` (importado por `BaseLayout`)
- [ ] Tests E2E `tests/e2e/auth-login-standalone.spec.ts`:
  - Login exitoso redirige a `/dashboard`
  - Login inválido muestra mensaje inline
  - Botón Google muestra toast y NO redirige
  - Query param `redirigir` se respeta
  - Usuario ya autenticado es redirigido a `/dashboard`

## Definition of done

- [ ] Mockup revisado y consistente con el resto de vistas de auth
- [ ] Tests Vitest + E2E pasan
- [ ] Sabotaje 1: quitar el import de `inicializarFormularioLogin` → submit del form no hace nada → test E2E rojo → restaurar
- [ ] Sabotaje 2: cambiar `redirigir` por `/otra-cosa` en el handler → query param `?redirigir=/p/juan` no se respeta → test E2E rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/client/auth/login.ts`
- [ ] Type check verde
- [ ] `grep -rn 'style="' src/pages src/components src/layouts` → 0 ocurrencias (R1)
- [ ] `grep -rn '<script>' src/pages src/components src/layouts` → solo imports o hidratación trivial (R2)
- [ ] PR mergeado a `develop` vía `/respaldo`

## Riesgos / notas

- Esta HU **NO** agrega lógica nueva de auth; reutiliza HU-01.1 (endpoint `/auth/iniciar-sesion`). Si HU-01.1 no está implementada, esta HU queda bloqueada.
- El componente `AuthButtons` se reutiliza también en `dashboard.astro` y en futuras vistas donde se necesite login. No crear componentes paralelos.