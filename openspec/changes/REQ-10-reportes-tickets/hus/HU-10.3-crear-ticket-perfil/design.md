# Diseno tecnico — HU-10.3 — Crear ticket desde perfil de prestador

**REQ padre:** REQ-10-reportes-tickets

## Modelo de datos

Mismo que HU-10.2: INSERT en `tickets` + INSERT en `ticket_messages`. Diferencias:

- `created_by_user_id` se popula desde la sesión.
- `target_provider_id` se popula desde el body.
- `kind` puede ser `suplantacion | mal_servicio | contenido` (no `consulta`; el anónimo maneja ese).
- Si ya existe ticket abierto del mismo `(user_id, target_provider_id)`: INSERT extra en `ticket_messages` con `sender='system'`, `internal_note=true`, body warning.

## Contrato de API

Mismo endpoint POST `/api/v1/tickets` (HU-10.2), schema distinto cuando hay sesión.

| Endpoint | Método | Auth | Request body | Response 201 | Errores |
|---|---|---|---|---|---|
| `/api/v1/tickets` | POST | sesión user (rol=user) | `{ kind: 'suplantacion'\|'mal_servicio'\|'contenido', targetProviderId, subject: 5..150, body: 1..5000 }` | `{ id, status, kind, createdAt }` | 401, 422 (Zod), 404 (provider no existe) |

## Validaciones Zod

```ts
// src/lib/validators/tickets.ts (extender)
export const authenticatedTicketCreateSchema = z.object({
  kind: z.enum(['suplantacion', 'mal_servicio', 'contenido']),
  targetProviderId: z.number().int().positive(),
  subject: z.string().min(5).max(150),
  body: z.string().min(1).max(5000),
});
```

## Componentes UI

### Componente Astro

- `src/components/providers/ReportModal.astro`:
  - Props: `providerId: number`, `providerName: string`, `currentUser: { name, email } | null`.
  - Modal con backdrop (`fixed inset-0 bg-black/60 z-[100]`) replicando `mockups/profile.html:238-296`.
  - Si `currentUser` no es null → prellenar Nombre y Email (readonly).
  - Si `currentUser` es null → el modal redirige al flujo anónimo (HU-10.2) con un CTA "Regístrate para reportar más rápido" (decisión: si no hay sesión, el modal muestra ese CTA y no se abre el form).
  - Tipos de reporte como `<select>` con `suplantacion | mal_servicio | contenido`.
  - Textarea para detalle.
  - Submit hace fetch a `/api/v1/tickets` con `authenticatedTicketCreateSchema`.
- Isla pequeña: `<script>` inline para abrir/cerrar modal + submit.

## Flujo de interaccion (secuencial)

### Cliente

1. Visitante en `/p/<slug>` autenticado hace clic en "Reportar" (`mockups/profile.html:100-102`).
2. JS abre `ReportModal` con datos del prestador y de la sesión.
3. Usuario completa tipo + detalle, hace clic en "Enviar Reporte".
4. JS hace `fetch('/api/v1/tickets', { method: 'POST', body: JSON.stringify({ kind, targetProviderId, subject, body }) })`.
5. Si 201 → cierra modal, muestra toast "Reporte enviado. Te contactaremos por email."
6. Si 422 → muestra errores inline.

### Servidor

1. Handler POST `/api/v1/tickets`:
   a. Si `session === null` → usar `anonymousTicketCreateSchema` (rama HU-10.2).
   b. Si `session !== null` → usar `authenticatedTicketCreateSchema`.
   c. Validar body según el schema → 422.
   d. `verifyProviderExists(env, targetProviderId)` → 404 si no.
   e. Transacción: INSERT ticket + INSERT mensaje (`sender='author'`).
   f. `checkDuplicateTicketsAgainstProvider(env, userId, providerId)`:
      - Si hay tickets abiertos previos del mismo user contra el mismo provider → INSERT extra en `ticket_messages` con `sender='system'`, `internal_note=true`, body `[system] usuario ya tiene N tickets abiertos contra este prestador`.
   g. `successResponse(ticket, 201)`.

## Capa de servicios

- `src/lib/services/tickets.ts` (extender `createTicket`):
  - Rama autenticada.
  - Helper `verifyProviderExists(env, providerId): Promise<boolean>`.
  - Helper `findOpenTicketsAgainstProvider(env, userId, providerId): Promise<number>` — `SELECT COUNT(*) FROM tickets WHERE created_by_user_id=? AND target_provider_id=? AND status != 'cerrado'`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/tickets.test.ts` (extender) | `authenticatedTicketCreateSchema`: kind válido; target_provider_id positivo; subject 5..150; body 1..5000 |
| Unit | `tests/unit/services/tickets.test.ts` (extender) | `createTicket` autenticado happy path; `verifyProviderExists` true/false; `findOpenTicketsAgainstProvider` count correcto |
| Unit | `tests/unit/services/tickets.test.ts` (extender) | segundo ticket del mismo user contra mismo provider → INSERT ticket_message system + internal_note=true |
| Integración | `tests/integration/tickets/create-from-profile.test.ts` | POST autenticado `mal_servicio` → 201 + `created_by_user_id` poblado; POST sin target_provider_id → 422; POST target_provider_id=99999 → 404; segundo ticket → 201 + system message |
| E2E | `tests/e2e/profile-report.spec.ts` | Playwright: login vecino, ir a `/p/<slug>`, clic "Reportar", completar form, submit, ver toast |

## Dependencias y secuencia

- **Bloqueado por:** HU-10.1, HU-10.2.
- **Bloquea a:** ninguna directa.
- **Recursos compartidos:** `ReportModal.astro` consume `authenticatedTicketCreateSchema`; el endpoint comparte router con HU-10.2.

## Riesgos tecnicos

- Riesgo: `findOpenTicketsAgainstProvider` hace N queries si el admin lista muchos tickets → Mitigación: indexar `(created_by_user_id, target_provider_id, status)` si se vuelve瓶颈; fuera de scope inmediato.
- Riesgo: el `system` message queda visible si el admin filtra `internal_note=false` por error → Mitigación: la query de HU-10.6 filtra `internal_note=0` para autores; el admin ve ambos. Cubierto por HU-10.6.
- Riesgo: el modal no se cierra tras 201 si el JS no maneja la respuesta → Mitigación: tests E2E con aserción de cierre.
- Riesgo: el visitante no autenticado ve el modal pero el form no funciona → Mitigación: el modal detecta `currentUser === null` y muestra CTA en lugar del form (decisión: en lugar de mostrar form roto).
