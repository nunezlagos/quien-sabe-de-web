# HU-20.4 — Banner "email no verificado" en dashboard del usuario

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-20-verificacion-email-post-registro

## Historia de usuario

**Como** usuario autenticado con `email_verified_at=null`
**Quiero** ver un banner destacado en mi dashboard
**Para** recordar que debo verificar mi correo y poder usar funciones críticas (reseñas, favoritos)

## Contexto

Una vez que el usuario recibe el email de verificación (HU-20.1) y mientras
no haya hecho click en el enlace (HU-20.2), la plataforma debe recordarle
constantemente que verifique su correo.

El banner debe:
- Ser visible en todas las vistas autenticadas del usuario (dashboard-user, dashboard-provider, perfil)
- Ser dismissable (botón X)
- Tener acción primaria "Reenviar correo" → POST `/api/v1/auth/verify-email/resend` (HU-20.3)
- No aparecer si el usuario ya verificó (`email_verified_at IS NOT NULL`)

## Mockup de referencia

- `mockups/dashboard-user.html` (banner amarillo al inicio del `<main>`) — bloque insertado en línea 28 del mockup
- Patrón visual: `bg-yellow-50 border-2 border-yellow-200 rounded-2xl` con icono `ri-mail-unread-line`

## Criterios de aceptación (Gherkin)

### Escenario: Banner visible para usuario sin verificar
  Dado usuario `vecino@demo.cl` con `email_verified_at=null`
  Cuando visito `/dashboard`
  Entonces veo el banner amarillo arriba del contenido
  Y el banner muestra el email del usuario (`vecino@demo.cl`)
  Y hay un botón "Reenviar correo"
  Y hay un link "Ya lo verifiqué" → `/verify-email`

### Escenario: Banner NO visible para usuario verificado
  Dado usuario con `email_verified_at` seteado
  Cuando visito `/dashboard`
  Entonces NO veo el banner

### Escenario: Click en "Reenviar correo" envía email
  Dado que veo el banner
  Cuando click "Reenviar correo"
  Entonces se llama `POST /api/v1/auth/verify-email/resend`
  Y se muestra toast "Correo reenviado. Revisa tu bandeja."
  Y el botón se desactiva por 30s para evitar spam

### Escenario: Click en X oculta el banner (sesión)
  Dado que veo el banner
  Cuando click X
  Entonces se oculta por el resto de la sesión (en sessionStorage, no cookie)
  Y reaparece en siguiente visita

### Escenario: Click en "Ya lo verifiqué" navega
  Cuando click "Ya lo verifiqué"
  Entonces redirige a `/verify-email-status` (página que muestra "Revisa tu correo y haz click en el enlace")

## Tareas técnicas

- [ ] Componente `src/components/auth/EmailVerificationBanner.astro` (server-rendered)
- [ ] Helper server-side `shouldShowEmailBanner(user): boolean` en `src/lib/services/auth/email-verification.ts`
- [ ] Lógica de cliente en `src/lib/client/auth/email-banner.ts`:
  - Click "Reenviar correo" → fetch + toast + cooldown
  - Click X → sessionStorage set
  - On load → si sessionStorage.set('email-banner-dismissed'), ocultar
- [ ] Estilos del banner en `src/styles/components.css` (clase `.email-banner`)
- [ ] Insertar `<EmailVerificationBanner />` en:
  - `src/pages/dashboard.astro` (dashboard unificado)
  - Cualquier vista autenticada donde el banner aplique
- [ ] Tests:
  - Unit: `shouldShowEmailBanner` con `email_verified_at=null/now`
  - Integración: GET `/dashboard` con usuario no verificado → HTML contiene el banner; con usuario verificado → NO contiene
  - E2E: login con vecino (que en esta fase tiene `email_verified_at=null`) → ve banner → click X → desaparece → reload → reaparece

## Definition of done

- [ ] Tests unit + integración + E2E pasan
- [ ] Sabotaje 1: cambiar `shouldShowEmailBanner` para que retorne `true` siempre → test E2E "usuario verificado NO ve banner" rojo → restaurar
- [ ] Sabotaje 2: no respetar el cooldown de 30s en "Reenviar correo" → test integración que hace 2 clicks consecutivos → segundo click da 429 → restaurar
- [ ] Type check verde
- [ ] Cero `style="..."` inline (R1)
- [ ] JS del banner extraído a `.ts` aparte (R2)
- [ ] PR mergeado a `develop`

## Riesgos / notas

- En esta fase los usuarios demo (`vecino@demo.cl`, `prestador@demo.cl`, `admin@demo.cl`) tienen `email_verified_at=null` por default → siempre verán el banner. Esto es esperado.
- Si el admin quiere forzar la verificación de los demos, setea `email_verified_at=now()` manualmente.
- El banner NO debe interrumpir el flujo de uso normal (no modal, no overlay, solo un banner dismissable arriba).