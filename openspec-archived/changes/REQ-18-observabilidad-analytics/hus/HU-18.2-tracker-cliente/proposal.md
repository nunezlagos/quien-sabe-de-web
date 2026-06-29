# Propuesta — HU-18.2 — Helper cliente track(event, props)

**Estado:** propuesta | **REQ padre:** REQ-18-observabilidad-analytics

## Contexto

El frontend necesita un único punto para emitir eventos al backend desde botones y flujos (búsqueda, signup, contacto, donación). Sin un helper centralizado, cada isla repite lógica de `fetch` y se filtran datos PII por descuido. El helper resuelve esto con un único `track(event, props)` que sanitiza por allowlist, usa `sendBeacon` para no bloquear navegación y nunca lanza.

## Mockups de referencia

- `mockups/js/home.js:273` — `searchBtn.addEventListener('click', handleSearch)` → punto de emisión de `event='search'`.
- `mockups/js/home.js:254-271` — función `handleSearch` con `keyword`, `selectedTrade`, `selectedCommune` → fuentes de props sanitizables (`trade`, `commune`, sin keyword libre por riesgo PII).
- `mockups/index.html:103-108` — input de búsqueda y CTA cuyo click dispara el evento.
- UI a diseñar siguiendo este estilo: los demás eventos (signup, contact, donation, ticket_open, review) se cablearán en sus respectivas vistas; el helper es agnóstico.

## Alternativas consideradas

### Opción A — Helper único con allowlist por evento y `sendBeacon` + fallback `fetch(keepalive)`
- Un módulo `track.ts` exporta `track(event, props)`; un mapa `eventSchemas.ts` define allowlist de claves por evento.
- Pro: punto único, sanitización determinista, no bloquea unload, sin dependencias externas, satisface los 3 Gherkin.
- Contra: requiere mantener la allowlist sincronizada con los Zod del backend.

### Opción B — `fetch` simple con `await` sin allowlist
- Llamar a `fetch('/api/v1/events/track', {body: JSON.stringify(props)})` directamente desde cada isla.
- Pro: trivial.
- Contra: viola criterio Gherkin de sanitización PII, bloquea unload, no tiene fallback.

### Opción C — Librería externa de analytics (Plausible, PostHog client)
- Usar SDK de terceros.
- Contra: dependencia externa, no respeta el contrato propio `/api/v1/events/track`, no integra con la sanitización PII por allowlist específica del dominio.

## Decisión

Se adopta **Opción A**. Cumple los tres Gherkin (sendBeacon, allowlist, fallback silencioso) y mantiene el control total del payload. La allowlist queda en `eventSchemas.ts` y se referencia desde el Zod del backend (HU-18.3) para mantener una única fuente de verdad por evento.

## Riesgos y mitigaciones

- Allowlist cliente desincronizada de Zod backend → tests unitarios comparan las llaves de ambos módulos como verificación cruzada.
- `sendBeacon` no disponible (entornos antiguos) → el fallback `fetch` con `keepalive: true` está cubierto por el Gherkin 3.
- Errores de red ruidosos en consola → la HU exige fallo silencioso; el helper captura todo dentro de try/catch.

## Métrica de éxito

- En entorno dev, al hacer click en el botón de búsqueda (`mockups/index.html:108`) se observa un POST a `/api/v1/events/track` en DevTools con `props` filtrado por allowlist y sin claves PII.
- Tests unitarios verdes contra `tests/unit/client/track.test.ts`.
