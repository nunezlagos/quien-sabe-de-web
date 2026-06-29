# HU-15.6 — Boletas adjuntas en R2 con link público firmado

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-15-transparencia-publica

## Historia de usuario

**Como** admin y público
**Quiero** subir boletas/facturas a R2 y exponer link firmado
**Para** respaldo documental de gastos

## Criterios de aceptación (Gherkin)

### Escenario: Subir boleta y vincular a expense
  Cuando admin solicita `POST /api/v1/admin/expenses/<id>/document` con content-type
  Entonces recibo presigned URL para PUT
  Y al confirmar, `document_r2_key` queda en la fila

### Escenario: Visitante ve link público firmado en /transparency
  Dado un expense con documento
  Cuando visito `/transparency` y expando el detalle
  Entonces aparece link "Ver boleta" con URL firmada 1h

### Escenario: Documento no existe → 404 sin filtración
  Dado un expense sin document_r2_key
  Cuando se renderiza
  Entonces NO aparece el link

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/admin/expenses/[id]/document.ts`
- [ ] Helper `signGetUrl` reusado de REQ-03
- [ ] Vista detalle en `src/components/transparency/ExpenseRow.astro`
- [ ] Tests `tests/integration/transparency/expense-doc.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
