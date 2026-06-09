# REQ-10-reportes-tickets

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Sistema de tickets para que cualquier usuario (autenticado o no) reporte:
suplantación, mal servicio, contenido inapropiado o consulta general. Cola
admin con estados (abierto, en_revisión, cerrado) y hilo de mensajes.

## Criterios de éxito

- [ ] Vecino reporta a prestador desde su perfil con un solo click.
- [ ] Visitante anónimo puede crear ticket (categoría "consulta") con email de contacto.
- [ ] Admin asigna, transiciona estado y deja notas internas.
- [ ] Notificación email al solicitante en cada cambio de estado.
- [ ] SLA inicial de respuesta: 72 horas hábiles.

## Superficie técnica

### Endpoints API
- `POST  /api/v1/tickets` — crear (con/sin sesión) [público]
- `GET   /api/v1/tickets/:id` — ver (autor o admin) [auth]
- `GET   /api/v1/admin/tickets` — cola completa [admin]
- `PATCH /api/v1/admin/tickets/:id` — transicionar estado/asignar [admin]
- `POST  /api/v1/tickets/:id/messages` — agregar mensaje [autor/admin]

### Vistas Astro
- Modal "Reportar" en `/p/:slug`
- `/dashboard-admin#tickets` — cola

### Tablas Drizzle
- `tickets` (id, kind, status, assignee_admin_id, target_provider_id?, created_by_user_id?, contact_email, created_at)
- `ticket_messages` (id, ticket_id, sender, body, internal_note, created_at)

### Bindings Cloudflare
- `D1`, `SES` (notificaciones)

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-10.1 | schema-tickets | Tablas + estados | P0 |
| HU-10.2 | crear-ticket-publico | POST sin sesión | P0 |
| HU-10.3 | crear-ticket-perfil | POST contra provider_id | P0 |
| HU-10.4 | cola-admin | Listado + filtros | P0 |
| HU-10.5 | transiciones-estado | PATCH con auditoría | P0 |
| HU-10.6 | hilo-mensajes | Conversación + notas internas | P1 |
| HU-10.7 | notificacion-email | Email en cada cambio | P0 |

## Tests requeridos

- **Unit:** state machine de tickets (abierto → en_revisión → cerrado; transiciones inválidas → error).
- **Integración:** crear sin sesión → OK; admin lista todos; otro admin no puede ver notas internas con role insuficiente.
- **E2E:** vecino reporta → admin recibe en cola → cierra → vecino recibe email "resuelto".

## Dependencias

- **Depende de:** REQ-07, REQ-17
- **Habilita a:** REQ-13

## Riesgos / suposiciones

- Captcha en form público para evitar spam (HU futura si se detecta abuso).
- Notas internas estrictamente NO visibles para el solicitante.
