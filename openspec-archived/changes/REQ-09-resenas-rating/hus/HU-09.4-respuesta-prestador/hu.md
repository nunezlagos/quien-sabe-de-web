# HU-09.4 — Respuesta única del prestador a una reseña

**Estado:** implementada | **Prioridad:** P1 | **REQ padre:** REQ-09-resenas-rating

## Historia de usuario

**Como** prestador
**Quiero** responder públicamente a una reseña
**Para** dar contexto o defender mi servicio

## Criterios de aceptación (Gherkin)

### Escenario: Crear respuesta única
  Dado una reseña sobre `provider_id=42`
  Cuando el prestador dueño envía `POST /api/v1/reviews/<id>/response` con `{"body":"Gracias por el feedback"}`
  Entonces recibo status 201
  Y existe fila en `review_responses` con esa reseña

### Escenario: Segunda respuesta → 409
  Dado una reseña que ya tiene respuesta
  Cuando se envía otra
  Entonces recibo status 409

### Escenario: Respuesta a reseña ajena → 403
  Dado el prestador A intenta responder reseña dirigida al prestador B
  Cuando envía POST
  Entonces recibo status 403

### Escenario: Respuesta visible en GET público
  Dado una respuesta publicada
  Cuando consulto `GET /api/v1/providers/42/reviews`
  Entonces cada item incluye `response: { body, created_at } | null`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/reviews/[id]/response.ts`
- [ ] Validador con max 500 chars
- [ ] Tests `tests/integration/reviews/response.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
