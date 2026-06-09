# HU-11.4 — Modal de edición de perfil del vecino

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-11-dashboard-vecino

## Historia de usuario

**Como** vecino
**Quiero** editar foto, comuna y preferencias desde un modal
**Para** actualizar mis datos sin abandonar el dashboard

## Criterios de aceptación (Gherkin)

### Escenario: Abrir modal carga datos actuales
  Dado un vecino en `/dashboard-user`
  Cuando clickea "Editar perfil"
  Entonces el modal muestra `commune`, `notify_email`, `interests` con valores actuales

### Escenario: Guardar persiste cambios
  Cuando envía el form del modal con `commune_id=13123`
  Entonces el endpoint `PATCH /api/v1/users/me/profile` se invoca
  Y al recargar, la comuna aparece actualizada

### Escenario: Validación inline de email opcional
  Cuando ingresa email mal formado
  Entonces el modal muestra error sin enviar request

## Tareas técnicas

- [ ] Componente `src/components/dashboard/user/EditProfileModal.astro`
- [ ] Reuso de `PATCH /api/v1/users/me/profile` (REQ-02)
- [ ] Tests `tests/e2e/edit-profile-vecino.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
