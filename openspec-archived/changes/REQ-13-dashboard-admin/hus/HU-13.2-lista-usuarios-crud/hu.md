# HU-13.2 — Listado de usuarios con ban y cambio de rol

**Estado:** implementada-mvp | **Prioridad:** P0 | **REQ padre:** REQ-13-dashboard-admin

## Historia de usuario

**Como** admin
**Quiero** administrar la lista de usuarios
**Para** operar bans y cambios de rol con auditoría

## Criterios de aceptación (Gherkin)

### Escenario: Listar usuarios paginado con filtros
  Cuando envía `GET /api/v1/admin/users?role=prestador&status=active&limit=20`
  Entonces recibo `{ items: [...20], cursor }`

### Escenario: Banear usuario
  Cuando envía `PATCH /api/v1/admin/users/<id>` con `{"status":"banned"}`
  Entonces el usuario queda baneado
  Y sus sesiones en KV son invalidadas
  Y se audita la acción

### Escenario: Cambiar rol vecino → admin
  Cuando envía `{"role":"admin"}`
  Entonces se aplica con auditoría

### Escenario: Admin no puede banearse a sí mismo
  Dado un admin con id=1
  Cuando envía `PATCH /api/v1/admin/users/1` con `status="banned"`
  Entonces recibo status 409 con `{ "error": "no puede banearse a sí mismo" }`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/admin/users/index.ts` y `[id].ts`
- [ ] Invalidación de KV de sesiones del usuario al banear
- [ ] Componente `src/components/admin/UsersList.astro`
- [ ] Actualizar `mockups/dashboard-admin.html` modal `#user-modal`: select 'Estado' debe incluir opción 'Banned'. Select 'Rol' debe usar labels 'Vecino'/'Proveedor'/'Administrador' (alineado con naming interno 'vecino'/'prestador'/'admin').
- [ ] Tests `tests/integration/admin/users-crud.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
