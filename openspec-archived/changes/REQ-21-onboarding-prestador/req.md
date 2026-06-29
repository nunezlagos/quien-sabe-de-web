# REQ-21-onboarding-prestador

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Wizard "Ofrece tus servicios" que captura datos esenciales del prestador
en un único formulario (basado en `mockups/create-trade.html`), crea el
perfil en estado `pending_verification` y redirige a `/verification`
(REQ-03). Incluye selector multi-comuna basado en `communesList` y
selector de oficio basado en `tradesList` (`mockups/js/data.js:2-16`).

## Criterios de éxito

- [ ] Form refleja exactamente los campos del mockup:
      Nombre Visible, Oficio, Bio, WhatsApp, Precio Base, Certificado
      opcional (`mockups/create-trade.html:55-108`).
- [ ] WhatsApp normalizado a `+569` + 8 dígitos (prefix UI línea 87).
- [ ] Submit crea `providers` con `status="pending_verification"`.
- [ ] Cobertura multi-comuna persistida en tabla `provider_communes`.
- [ ] Redirige a `/verification` al crear (link "Subir Certificado" línea 105).
- [ ] Banner "Verificación pendiente" visible en `dashboard-provider`
      mientras no termine REQ-03.

## Superficie técnica

### Endpoints API
- `POST /api/v1/providers/me` — extendido para aceptar wizard payload.
- `GET  /api/v1/catalog/trades` — taxonomía pública.
- `GET  /api/v1/catalog/communes` — comunas habilitadas.

### Vistas Astro
- `/create-trade` (port de `mockups/create-trade.html`).
- `/dashboard-provider` con banner condicional.

### Tablas Drizzle
- `providers` (existente, agrega `display_name`, `whatsapp`, `base_price_clp`).
- `provider_communes` (provider_id, commune_id, PK compuesta).

### Bindings Cloudflare
- `D1`

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-21.1 | wizard-form-base | Port del mockup create-trade.html | P0 |
| HU-21.2 | captura-oficio-comuna | Select de trades + multi-select comunas | P0 |
| HU-21.3 | endpoint-crear-perfil-pro | POST con Zod del wizard | P0 |
| HU-21.4 | redirect-a-verificacion | Submit → `/verification` | P0 |
| HU-21.5 | estado-pending-en-dashboard | Banner en dashboard-provider | P1 |

## Tests requeridos

- **Unit:** validador Zod del wizard (whatsapp regex, precio > 0).
- **Integración:** crear perfil → fila pending_verification → catálogo
  trades expone seed.
- **E2E:** vecino logueado → "Crear Perfil PRO" → completa wizard →
  redirige a `/verification`.

## Dependencias

- **Depende de:** REQ-01, REQ-02, REQ-03, REQ-04
- **Habilita a:** REQ-06, REQ-07, REQ-12, REQ-24

## Riesgos / suposiciones

- Mockup no muestra selector de comunas; se inserta sección "Cobertura"
  entre "Información Básica" y "Contacto y Precios" reutilizando el estilo
  de los cards `bg-white p-6 rounded-2xl`.
- Campo "Otro" del select de oficio (línea 69) habilita input free-text
  que admin debe aprobar antes de exponer en buscador.
