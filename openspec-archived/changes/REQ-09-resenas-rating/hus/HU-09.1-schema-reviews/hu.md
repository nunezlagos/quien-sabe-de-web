# HU-09.1 — Schema reviews + review_responses

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-09-resenas-rating

## Historia de usuario

**Como** sistema
**Quiero** modelar reseñas y respuestas del prestador
**Para** permitir feedback público con integridad

## Criterios de aceptación (Gherkin)

### Escenario: Migración crea tablas con constraints
  Cuando se aplica la migración
  Entonces existen `reviews(id, provider_id, user_id, rating 1-5, body, status, hidden_reason, created_at, edited_until)`
  Y un UNIQUE(user_id, provider_id) en `reviews`
  Y `review_responses(review_id PK, body, created_at)` con FK 1-a-1

### Escenario: Rating fuera de 1-5 falla
  Cuando intento insertar `rating=6`
  Entonces el CHECK constraint falla

### Escenario: Estados válidos: visible|hidden
  Cuando intento insertar `status="otro"`
  Entonces el CHECK falla

## Tareas técnicas

- [ ] Schema `reviews` y `review_responses` en `src/database/schema.ts`
- [ ] Migración `src/database/migrations/00XX_reviews.sql`
- [ ] Tests `tests/integration/reviews/schema.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
