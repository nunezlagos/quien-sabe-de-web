# HU-10.3 — Crear ticket desde perfil de prestador

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-10-reportes-tickets

## Historia de usuario

**Como** vecino autenticado
**Quiero** reportar a un prestador con un click desde su perfil
**Para** denunciar problemas rápidamente

## Criterios de aceptación (Gherkin)

### Escenario: Reporte de mal servicio desde perfil
  Dado un vecino autenticado
  Cuando envía `POST /api/v1/tickets` con `{"kind":"mal_servicio","target_provider_id":42,"subject":"...", "body":"..."}`
  Entonces recibo status 201
  Y `created_by_user_id` es el id del vecino
  Y `target_provider_id=42`

### Escenario: kind=suplantacion también requiere provider_id
  Cuando envía suplantación sin `target_provider_id`
  Entonces recibo status 422

### Escenario: Reportar a provider inexistente → 422
  Cuando `target_provider_id=99999`
  Entonces recibo status 422

### Escenario: Mismo vecino reporta dos veces al mismo prestador
  Dado un vecino que ya tiene un ticket abierto contra el provider 42
  Cuando crea otro contra el mismo provider
  Entonces recibo status 201 (no se bloquea) pero se incluye warning interno para admin

## Tareas técnicas

- [ ] Reuso del endpoint POST /tickets
- [ ] Componente `src/components/providers/ReportModal.astro` con tipos de reporte
- [ ] Actualizar `mockups/dashboard-provider.html` modal `#ticket-modal` (línea 397-441): reemplazar opciones del select 'Tipo de Problema' por las válidas del enum `tickets.kind`: 'Suplantación de identidad', 'Mal servicio', 'Contenido inapropiado', 'Consulta general'.
- [ ] Tests `tests/integration/tickets/create-from-profile.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
