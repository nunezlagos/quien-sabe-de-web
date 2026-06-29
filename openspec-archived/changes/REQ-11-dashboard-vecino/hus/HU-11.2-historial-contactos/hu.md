# HU-11.2 — Historial de contactos hechos paginado

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-11-dashboard-vecino

## Historia de usuario

**Como** vecino
**Quiero** ver los prestadores que contacté
**Para** volver fácilmente a ellos o dejar reseña

## Criterios de aceptación (Gherkin)

### Escenario: Listado paginado
  Dado un vecino con 14 contactos en `contact_events`
  Cuando envía `GET /api/v1/users/me/contacts?limit=10`
  Entonces recibo `{ items: [...10], cursor }`
  Y cada item incluye `provider: { slug, name, photo_url }, kind, created_at, can_review: bool`

### Escenario: can_review=false si ya reseñó
  Dado un contacto cuyo provider ya fue reseñado por este vecino
  Cuando se lista
  Entonces `can_review=false`

### Escenario: Otro vecino no ve mis contactos
  Dado el vecino A consulta `/users/me/contacts`
  Cuando se ejecuta
  Entonces sólo aparecen contactos donde `ip_hash` o un join indirecto matchea a A; nunca de B

## Tareas técnicas

- [ ] Tabla extra `contact_events_users (event_id, user_id)` o columna `user_id` opcional para soportar usuarios autenticados (decisión: agregar `user_id` nullable al schema de REQ-08)
- [ ] Endpoint `src/pages/api/v1/users/me/contacts.ts`
- [ ] Componente `src/components/dashboard/user/ContactsHistory.astro`
- [ ] Tests `tests/integration/users/contacts-history.test.ts`
- [ ] Mockup: dentro del tab 'Historial' de `mockups/dashboard-user.html`, listar contactos con foto del prestador, nombre, oficio, icono del canal (WhatsApp/email/teléfono), fecha relativa, y CTA 'Dejar reseña' si `can_review=true`.

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
