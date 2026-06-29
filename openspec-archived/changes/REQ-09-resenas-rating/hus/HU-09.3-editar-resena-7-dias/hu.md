# HU-09.3 — Editar reseña dentro de 7 días

**Estado:** implementada | **Prioridad:** P1 | **REQ padre:** REQ-09-resenas-rating

## Historia de usuario

**Como** vecino que dejó una reseña
**Quiero** editar mi reseña dentro de la ventana de 7 días
**Para** corregir errores o actualizar mi opinión

## Criterios de aceptación (Gherkin)

### Escenario: Editar dentro de ventana
  Dado una reseña con `created_at = ahora - 3 días`
  Cuando envío `PATCH /api/v1/reviews/<id>` con `{"rating":4,"body":"Actualización"}`
  Entonces recibo status 200 y los campos quedan actualizados

### Escenario: Editar fuera de ventana → 403
  Dado una reseña creada hace 8 días
  Cuando intento PATCH
  Entonces recibo status 403 con `{ "error": "edición fuera de ventana" }`

### Escenario: Editar reseña ajena → 403
  Dado el vecino A intenta editar reseña de B
  Cuando envía PATCH
  Entonces recibo status 403

### Escenario: Ventana congelada tras respuesta del prestador
  Dado una reseña con respuesta ya publicada
  Cuando el vecino intenta editar (aún dentro de 7 días)
  Entonces recibo status 409 con `{ "error": "edición bloqueada por respuesta" }`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/reviews/[id].ts` (PATCH)
- [ ] Helper `canEditReview(review)` chequea ventana y respuesta
- [ ] Tests `tests/unit/reviews/canEdit.test.ts`, `tests/integration/reviews/edit.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
