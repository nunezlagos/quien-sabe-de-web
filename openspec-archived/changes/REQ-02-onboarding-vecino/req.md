# REQ-02-onboarding-vecino

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Captura de datos del rol vecino tras registro: comuna, preferencias de búsqueda
y consentimientos legales (Ley 19.628). Habilita reseñas, favoritos y
dashboard de vecino.

## Criterios de éxito

- [ ] Tras registrarse, el vecino aterriza en `/onboarding` si su perfil está incompleto.
- [ ] Selección de comuna obligatoria con catálogo predefinido.
- [ ] Aceptación explícita de términos + política de privacidad antes de continuar.
- [ ] Perfil completo redirige a `/dashboard-user`.
- [ ] `GET /api/v1/users/me/profile` devuelve flag `onboarded: true/false`.

## Superficie técnica

### Endpoints API
- `GET   /api/v1/users/me/profile` — estado del perfil [sesión]
- `POST  /api/v1/users/me/profile` — completa onboarding [sesión]
- `PATCH /api/v1/users/me/profile` — actualizar campos [sesión]

### Vistas Astro
- `/onboarding` — formulario wizard (comuna → preferencias → consentimientos)

### Tablas Drizzle
- `users` (extensión: commune_id, onboarded_at, accepted_terms_at)
- `communes` (catálogo Región Metropolitana)
- `user_preferences` (notificaciones, intereses)

### Bindings Cloudflare
- `D1`

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-02.1 | catalogo-comunas | Seed de comunas RM en migración | P0 |
| HU-02.2 | form-onboarding | Wizard onboarding con Zod | P0 |
| HU-02.3 | preferencias-vecino | Preferencias de notificación e intereses | P1 |
| HU-02.4 | redirect-onboarding | Middleware redirige a `/onboarding` si incompleto | P0 |

## Tests requeridos

- **Unit:** schema Zod del onboarding, lógica del middleware `requireOnboarded`.
- **Integración:** POST onboarding completo, PATCH parcial, GET profile.
- **E2E:** registro → onboarding completo → dashboard-user; registro → intento de acceder a `/dashboard-user` sin completar → redirect.

## Dependencias

- **Depende de:** REQ-01
- **Habilita a:** REQ-09, REQ-11

## Riesgos / suposiciones

- Catálogo de comunas inicial sólo Región Metropolitana (52 comunas).
- Consentimientos versionados (cambio de términos requiere re-aceptación).
