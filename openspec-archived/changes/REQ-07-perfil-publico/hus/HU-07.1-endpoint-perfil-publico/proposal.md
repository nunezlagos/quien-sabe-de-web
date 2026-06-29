# Propuesta — HU-07.1 — Endpoint GET de perfil público

**Estado:** propuesta | **REQ padre:** REQ-07-perfil-publico

## Contexto

El perfil público es la cara visible del prestador en la plataforma. Necesitamos un endpoint público (sin sesión) que devuelva un DTO plano con todos los datos necesarios para renderizar `/p/:slug`: datos básicos del prestador, badge de verificación, catálogo de servicios activos, contacto enmascarado, promedio y total de reseñas. El endpoint es la base sobre la que se construyen las HUs 07.2 (layout), 07.3 (servicios) y 07.4 (reseñas). Debe aceptar tanto `id` numérico como `slug` humano (HU-07.5) y responder 404 si el prestador no existe o está soft-deleted. Vínculo con OE2 (perfiles como superficie de descubrimiento).

## Mockups de referencia

- `mockups/profile.html:56-114` — sidebar con foto, oficio, comuna, rating, contador "trabajos realizados" y botones de contacto (modelo de DTO).
- `mockups/profile.html:119-125` — bloque "Sobre mí" (descripción).
- `mockups/profile.html:166-169` — estado de error 404 ("Vecino no encontrado").

## Alternativas consideradas

### Opcion A — Endpoint REST `/api/v1/providers/:idOrSlug` con GET plano y DTO
- Resolver dual (id numérico o slug), DTO `PublicProvider` tipado, Zod de respuesta, JSON 200 / 404.
- Pro: contrato estable y testeable; una sola fuente de verdad para el cliente y el SSR.
- Pro: DTO permite enmascarar PII del prestador (teléfono, email) antes de serializar.
- Contra: requiere mantener el shape alineado entre backend y SSR; un cambio rompe ambas superficies.

### Opcion B — Renderizar directo desde SSR sin endpoint JSON
- La vista `/p/:slug` consulta Drizzle directo; el cliente sólo recibe HTML.
- Pro: cero round-trip y datos siempre frescos.
- Contra: bloquea a clientes futuros (app móvil, integraciones), y dificulta testear el contrato sin browser.
- Contra: el SSR se acopla al DDL.

### Opcion C — GraphQL
- Schema GraphQL con resolvers para `provider(idOrSlug)`.
- Pro: cliente pide sólo lo que necesita.
- Contra: añade un stack paralelo al REST existente; overhead operacional no justificado para 1 query.

## Decision

Se elige **Opcion A**. Un endpoint REST plano mantiene la convención del proyecto (`/api/v1/...`), es trivial de testear con `fetch` contra Workers, y desacopla el DTO de la vista. El SSR de `/p/:slug` consume este mismo endpoint (HU-07.2), evitando duplicación de queries. El DTO enmascara `phone`, `whatsapp` y `email` (campos `*_masked`); el clic trackeable (REQ-08) los revela on-demand.

## Riesgos y mitigaciones

- Riesgo: el DTO crece y empieza a filtrar PII accidental → Mitigación: tipar `PublicProvider` con campos explícitos; revisar en PR contra lista de PII (REQ-22).
- Riesgo: 404 vs 410 para soft-deleted → Mitigación: respondemos 404 para no distinguir soft-delete de inexistente (anti-enumeración).
- Riesgo: carga del endpoint sin cache edge satura D1 → Mitigación: HU-07.6 documenta edge cache con TTL 60s; el PR actual no añade headers de cache y queda como follow-up.

## Metrica de exito

- `curl /api/v1/providers/juan-perez-gasfiter-las-condes` → 200 con DTO completo (id, slug, trade, commune, description, photo_url, verified, rating_avg, services[], contact{}, reviews_count).
- `curl /api/v1/providers/42` → 200 con el mismo DTO.
- `curl /api/v1/providers/no-existe` → 404 JSON `{ success:false, error:"provider not found" }`.
- `curl /api/v1/providers/<id-de-soft-deleted>` → 404 (no expone el estado).
