# HU-11.3 — Listado de reseñas dejadas con CTA editar

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-11-dashboard-vecino

## Historia de usuario

**Como** vecino
**Quiero** ver las reseñas que dejé y editarlas si están en ventana
**Para** mantener mis reseñas al día

## Criterios de aceptación (Gherkin)

### Escenario: Listado reseñas propias
  Dado un vecino con 3 reseñas
  Cuando envía `GET /api/v1/users/me/reviews`
  Entonces recibo `{ items: [{id, provider:{slug,name}, rating, body, created_at, editable: bool}] }`

### Escenario: editable=true dentro de 7 días
  Dado una reseña creada hace 2 días sin respuesta
  Cuando se lista
  Entonces `editable=true`

### Escenario: editable=false fuera de ventana
  Dado una reseña creada hace 9 días
  Cuando se lista
  Entonces `editable=false`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/users/me/reviews.ts`
- [ ] Reuso helper `canEditReview`
- [ ] Componente `src/components/dashboard/user/MyReviews.astro` con CTA editar inline
- [ ] Tests `tests/integration/users/my-reviews.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
