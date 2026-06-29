# Propuesta — HU-11.2 — Historial de contactos del vecino

**Estado:** propuesta | **REQ padre:** REQ-11-dashboard-vecino

## Contexto

El vecino que contactó a un prestador debe poder volver a él desde su panel, sin tener que re-buscar y re-clicar WhatsApp. Esto es además el embudo natural hacia "dejar reseña" (CTA visible cuando `can_review=true`). Hoy `contact_events` (REQ-08) guarda `provider_id` + hashes pero NO el `user_id` autenticado, por lo que no hay forma de filtrar "mis contactos" para un usuario logueado — el filtro actual es por `ip_hash`, que falla cuando el vecino cambia de red o de dispositivo. Proponemos extender el esquema con `user_id NULLABLE` para mantener el path anónimo intacto y abrir el path autenticado.

## Mockups de referencia

- `mockups/dashboard-user.html:71-97` — lista de "Vecinos Guardados" con foto circular, nombre, chip de oficio y botón WhatsApp. Reusamos este patrón visual para la lista de contactos: cada fila es un prestador con su `provider.slug`, `name`, oficio principal y CTA para re-contactar.
- `mockups/profile.html` — perfil público de prestador. La fila del historial debe enlazar a `/p/<slug>` (REQ-07).

## Alternativas considered

### Opcion A — Agregar columna `user_id INTEGER NULL` a `contact_events` con FK a `users.id`
- Migración aditiva. `user_id NULL` mantiene compatibilidad con inserts anónimos.
- Pro: query de "mis contactos" es un índice directo `(user_id, created_at DESC)`.
- Pro: una sola fuente de verdad (no hay tabla puente que sincronizar).
- Contra: requiere migración y backfill opcional de filas existentes (no necesario — anónimos quedan NULL).

### Opcion B — Tabla puente `contact_events_users (event_id, user_id)`
- Tabla aparte que une `contact_events` con `users` para inserts autenticados.
- Pro: no toca el esquema de `contact_events` (HU-08.1 queda intocada).
- Contra: doble INSERT en el flujo autenticado; índice adicional; cardinalidad 1:1 con `contact_events` la hace redundante.

### Opcion C — Reusar `ip_hash` como proxy de usuario
- Filtrar contactos del mismo `ip_hash` que el usuario actual.
- Pro: cero cambios de esquema.
- Contra: falsos negativos al cambiar de red/WiFi/casa-oficina; falso positivo entre vecinos del mismo coworking. Inaceptable como única estrategia.

## Decision

Se elige **Opcion A**. Una columna `user_id NULL` con índice `(user_id, created_at DESC)` cumple los criterios de aceptación y deja el endpoint `GET /api/v1/users/me/contacts` con un WHERE directo. El insert autenticado (REQ-08.2) se actualiza para incluir `user_id` cuando hay sesión; el anónimo sigue funcionando sin tocar.

## Riesgos y mitigaciones

- Riesgo: índice extra en tabla append-only crece el storage → Mitigación: aceptable; tabla es append-only y el ratio filas/usuario es bajo.
- Riesgo: privacidad — un admin pidiendo contactos de otro vecino → Mitigación: el endpoint valida sesión y filtra por `locals.user.id`; nunca acepta `user_id` por query/body.
- Riesgo: backfill de filas existentes pierde historial real → Mitigación: documentado; los contactos pre-deploy quedan anónimos (NULL). No es data loss, es resignificación.

## Metrica de exito

- Migración aplica en D1 local sin errores: `docker exec quien-sabe-app bun run db:migrate:local`.
- `EXPLAIN QUERY PLAN` de `WHERE user_id = ? AND created_at >= ?` usa el índice nuevo.
- Test integración: vecino A con 14 contactos pide `?limit=10` → recibe 10 items + cursor; al pedir siguiente página recibe los 4 restantes.
- Test integración: vecino A NO ve contactos donde `user_id = B.id`.
- Test integración: `can_review=false` cuando existe fila en `reviews` del mismo `provider_id` para el `user_id` actual.
