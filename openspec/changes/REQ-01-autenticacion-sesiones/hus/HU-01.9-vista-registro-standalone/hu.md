# HU-01.9 — Vista `/registro` con mensaje "demo cerrada"

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-01-autenticacion-sesiones

## Historia de usuario

**Como** visitante anónimo que busca crear una cuenta
**Quiero** encontrar una página `/registro` que explique el estado actual del registro
**Para** entender por qué no puedo registrarme y cómo puedo participar en la demo

## Contexto

En esta fase el registro público está deshabilitado (REQ-01 lo difiere).
El endpoint `POST /api/v1/auth/registro` responde **410 Gone**.
`src/pages/registro.astro` actualmente tiene un form completo que ya no
debería ser funcional. Esta HU:

1. Cambia la vista para mostrar un mensaje claro ("Registro cerrado durante la demo").
2. Desactiva el endpoint (o lo deja marcado como deprecated con respuesta 410).
3. Mantiene la ruta `/registro` accesible para que el flujo desde el navbar/footer no rompa.

## Mockup de referencia

- `mockups/register.html` (a crear en esta HU) — vista standalone con:
  - Header mínimo (logo + "Volver al inicio")
  - Card centrada con icono de "puerta cerrada"
  - Título "El registro está cerrado durante la demo"
  - Subtítulo explicativo
  - 3 bullets con las formas de participar en la demo:
    - "Usa uno de los usuarios demo (vecino@demo.cl, prestador@demo.cl, admin@demo.cl)"
    - "Inicia sesión con email + contraseña en `/iniciar-sesion`"
    - "Solicita acceso anticipado a earlyaccess@quiensabe.cl"
  - Botón CTA "Iniciar sesión con un usuario demo" → `/iniciar-sesion`
  - Link inferior "¿Ya tienes cuenta? Inicia sesión"

## Criterios de aceptación (Gherkin)

### Escenario: GET /registro muestra mensaje claro
  Dado que NO hay sesión activa
  Cuando visito `GET /registro`
  Entonces recibo status 200
  Y la página NO contiene un form de registro con inputs
  Y muestra el título "El registro está cerrado durante la demo"
  Y muestra el CTA "Iniciar sesión con un usuario demo"

### Escenario: POST /api/v1/auth/registro responde 410
  Cuando envío `POST /api/v1/auth/registro` con cualquier body
  Entonces recibo status 410 con `{ "error": "registro deshabilitado en esta fase" }`
  Y NO se crea fila en `users`
  Y NO se setea cookie

### Escenario: Link "Iniciar sesión con un usuario demo"
  Cuando hago click en el CTA
  Entonces redirige a `/iniciar-sesion`
  Y en `/iniciar-sesion` se muestran los 3 usuarios demo disponibles

### Escenario: Ya autenticado redirige
  Dado que tengo cookie `session` válida
  Cuando visito `/registro`
  Entonces se redirige a `/dashboard` (consistente con `/iniciar-sesion`)

## Tareas técnicas

- [ ] Mockup `mockups/register.html` siguiendo el patrón visual de `mockups/login.html` (mismo navbar, mismo footer)
- [ ] Refactorizar `src/pages/registro.astro`:
  - Quitar el `<form>` y los inputs
  - Mostrar mensaje estático con icono + CTA a `/iniciar-sesion`
  - Mantener la query param `?redirigir=` para redirigir post-login (consistente con `/iniciar-sesion`)
  - Si hay sesión → redirigir a `redirigir` o `/dashboard`
  - Eliminar `<script>` inline (ya no hay lógica de form)
- [ ] Endpoint `src/pages/api/v1/auth/registro.ts`:
  - Mantener la ruta (no borrar) pero responder `410 Gone` con `{ error: "registro deshabilitado en esta fase" }`
  - Comentario en el archivo explicando por qué está deprecated
- [ ] Tests E2E `tests/e2e/auth-registro-closed.spec.ts`:
  - GET `/registro` muestra el mensaje
  - POST `/api/v1/auth/registro` → 410
  - Click en CTA redirige a `/iniciar-sesion`

## Definition of done

- [ ] Mockup revisado y consistente con el resto de vistas de auth
- [ ] Tests Vitest + E2E pasan
- [ ] Sabotaje 1: cambiar el `Astro.redirect` por un render normal → test E2E "ya autenticado" rojo → restaurar
- [ ] Sabotaje 2: cambiar el status code del endpoint a 200 → test E2E "410 Gone" rojo → restaurar
- [ ] Type check verde
- [ ] Cero `style="..."` inline
- [ ] Cero `<script>` inline con lógica (puede haber uno trivial para el handler del CTA si es necesario, o delegar a `<a href>` directo)
- [ ] PR mergeado a `develop`

## Riesgos / notas

- NO borrar el endpoint `registro.ts` porque está documentado en `req.md` y se reactivará cuando se habilite el registro público.
- Si en una fase futura se quiere habilitar el registro, esta HU se archiva y se reactiva HU-01.1 con su endpoint original.