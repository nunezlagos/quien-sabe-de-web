# HU-23.3 — Reorder y eliminar fotos del portfolio

**Estado:** implementada-mvp | **Prioridad:** P1 | **REQ padre:** REQ-23-portfolio-prestador

## Historia de usuario

**Como** prestador
**Quiero** reordenar y eliminar mis fotos
**Para** controlar cómo se ven en mi perfil público

## Criterios de aceptación (Gherkin)

### Escenario: Reorder via PATCH
  Cuando envío `PATCH /api/v1/providers/me/portfolio/reorder` con `{"order":[42,12,33]}`
  Entonces los `sort_order` quedan 0,1,2 respectivamente

### Escenario: Eliminar via DELETE
  Cuando envío `DELETE /api/v1/providers/me/portfolio/42`
  Entonces recibo status 204
  Y el objeto R2 ya no existe
  Y sort_order de las restantes se compacta (sin huecos)

### Escenario: Intentar borrar imagen ajena → 403
  Cuando prestador A borra imagen de prestador B
  Entonces recibo status 403

### Escenario: UI dashboard refleja delete
  Cuando hago clic en botón delete (`mockups/dashboard-provider.html:163` `<i class="ri-delete-bin-line">`)
  Entonces la card se quita del grid sin recargar

## Tareas técnicas

- [ ] Endpoints `src/pages/api/v1/providers/me/portfolio/[id].ts` (DELETE) y `.../reorder.ts` (PATCH)
- [ ] Cleanup R2 en transacción (eliminar fila + delete objeto)
- [ ] Compactador `compactSortOrder(providerId)` que recorre y reasigna
- [ ] Cliente JS `src/lib/client/portfolio.ts` para actualizar grid dashboard
- [ ] Tests `tests/integration/portfolio/reorder-delete.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
