# HU-07.1 — Endpoint GET de perfil público

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-07-perfil-publico

## Historia de usuario

**Como** visitante anónimo
**Quiero** consultar los datos públicos de un prestador
**Para** decidir si contactarlo

## Criterios de aceptación (Gherkin)

### Escenario: GET por slug devuelve perfil completo
  Dado un prestador con slug "juan-perez-gasfiter-las-condes"
  Cuando envío `GET /api/v1/providers/juan-perez-gasfiter-las-condes`
  Entonces recibo status 200 con `{ id, slug, trade, commune, description, photo_url, verified, rating_avg, services: [...], contact: { whatsapp_masked, phone_masked, email_masked }, reviews_count }`

### Escenario: GET por id numérico también funciona
  Cuando envío `GET /api/v1/providers/42`
  Entonces recibo el mismo DTO

### Escenario: Prestador inexistente → 404
  Cuando envío `GET /api/v1/providers/no-existe`
  Entonces recibo status 404

### Escenario: Prestador con status='deleted' → 404
  Dado un prestador soft-deleted
  Cuando se consulta su slug
  Entonces recibo status 404

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/providers/[idOrSlug].ts`
- [ ] DTO `PublicProvider` en `src/lib/dto/providers.ts`
- [ ] Resolver dual id/slug
- [ ] Tests `tests/integration/providers/public-get.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
