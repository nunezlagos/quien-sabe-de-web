# HU-09.2 — Crear reseña con gate por contact_event

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-09-resenas-rating

## Historia de usuario

**Como** vecino
**Quiero** calificar y comentar a un prestador
**Para** aportar mi experiencia y reputación a la plataforma

## Criterios de aceptación (Gherkin)

### Escenario: Crear reseña tras contacto válido
  Dado un vecino con un `contact_events` para `provider_id=42`
  Cuando envío `POST /api/v1/providers/42/reviews` con `{"rating":5,"body":"Excelente trabajo"}`
  Entonces recibo status 201
  Y la fila tiene `edited_until = created_at + 7 days`
  Y `status="visible"`

### Escenario: Crear sin contacto previo → 403
  Dado un vecino sin contactos al prestador 42
  Cuando intenta crear reseña
  Entonces recibo status 403 con `{ "error": "debe contactar antes de reseñar" }`

### Escenario: Reseña duplicada → 409
  Dado un vecino que ya reseñó al prestador 42
  Cuando intenta crear otra
  Entonces recibo status 409 con `{ "error": "ya reseñó a este prestador" }`

### Escenario: Body excede 1000 chars → 422
  Cuando envío body de 1500 caracteres
  Entonces recibo status 422

## Tareas técnicas

- [ ] Zod schema `ReviewCreate` en `src/lib/validators/reviews.ts`
- [ ] Endpoint `src/pages/api/v1/providers/[id]/reviews.ts` (POST)
- [ ] Gate `hasContactedProvider(userId, providerId)` que consulta `contact_events`
- [ ] Mockup: agregar en `mockups/profile.html` (después de la sección 'Sobre mí') bloque 'Dejar opinión' con 5 estrellas (radio inputs) + textarea + botón 'Publicar'. Visible solo si vecino autenticado tiene `contact_event` con ese provider.
- [ ] Tests `tests/integration/reviews/create.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
