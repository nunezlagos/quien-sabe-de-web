# Propuesta — HU-22.1 — Cookie banner inicial con elección persistida

**Estado:** propuesta | **REQ padre:** REQ-22-compliance-ley-19628

## Contexto

La Ley 19.628 (Chile) exige que el visitante sea informado y consienta sobre el tratamiento de datos antes de cualquier cookie no esencial. Hoy la plataforma no expone ningún banner: el visitante llega y los servicios de analytics (futuro REQ-18) podrían activarse sin base legal. Esta HU entrega el banner sticky-bottom en la primera visita con tres botones (Aceptar todo / Sólo necesarias / Configurar), persiste la decisión en cookie firmada HMAC y propaga al backend vía POST para registro.

## Mockups de referencia

- `mockups/about.html:48-61` — patrón de card `bg-white rounded-[2rem] shadow-xl border border-gray-100` reutilizable para la estética del banner.
- `mockups/dashboard-user.html:15-25` — patrón de navbar `bg-white shadow-sm sticky top-0` para entender cómo se renderizan elementos sticky en el sitio (mismo `z-50`).

## Alternativas consideradas

### Opción A — Cookie firmada HMAC + POST `/api/v1/consent/cookies`
- Cookie `qs_consent` con JSON `{analytics, communications, public_profile}` + firma HMAC-SHA256 con un secreto en `wrangler secret put CONSENT_SECRET`. Backend valida firma antes de confiar.
- POST opcional para registrar en DB si el user está logueado (audit trail).
- Pro: a prueba de tampering cliente; revocable rotando el secreto.
- Contra: requiere endpoint y helper nuevo.

### Opción B — Cookie en texto plano
- Pro: trivial de implementar.
- Contra: cualquier usuario puede editar la cookie para activar analytics sin consentimiento. No cumple con el principio de "manifestación expresa" de la Ley 19.628.

### Opción C — Sólo localStorage (sin cookie)
- Pro: simple.
- Contra: no se envía al backend, así que analytics server-side (futuro REQ-18) no puede consultar el consentimiento. No funciona para SSR condicional.

## Decisión

Se elige **Opción A**. La cookie firmada garantiza integridad y permite al backend consultar el consentimiento en cada request sin DB lookup (la cookie es la fuente de verdad en el request, la DB es sólo audit). El POST es opcional y se dispara una sola vez tras la decisión inicial.

## Riesgos y mitigaciones

- Riesgo: el banner oculta CTAs en mobile → Mitigación: usar `bottom-0 left-0 right-0` con padding inferior en `<body>` cuando el banner está visible (`document.body.style.paddingBottom = '120px'`).
- Riesgo: HMAC secret rota → todos los banners vuelven a aparecer (correcto, comportamiento esperado) → documentar el procedimiento de rotación en `docs/runbook.md` (vinculado a HU-25.3).
- Riesgo: SSR no puede leer cookies no-esenciales de primera visita → Mitigación: el banner se renderiza client-side siempre en primera visita; SSR no asume consentimiento.

## Métrica de éxito

- Primera visita (sin cookie `qs_consent`): banner visible con 3 botones.
- Click "Aceptar todo" → cookie `qs_consent` seteada con firma válida + POST 200 al endpoint + banner desaparece.
- Click "Sólo necesarias" → cookie con `{analytics: false, communications: false, public_profile: false}` + firma válida.
- Click "Configurar" → modal granular (HU-22.5 provee los toggles).
- Sabotaje: cambiar el secreto HMAC sin invalidar cookies existentes → todas las cookies dejan de validar y el banner reaparece → comportamiento correcto (no es bug, es feature).