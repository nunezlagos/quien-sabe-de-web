# Diseno tecnico — HU-17.5 — Template de cambio de estado de ticket

**REQ padre:** REQ-17-notificaciones-email

## Modelo de datos

No se introducen tablas. `email_log` (HU-17.2) registra el envío.

## Contrato de API

No se exponen endpoints nuevos. La transición interna del ticket (en
`src/lib/services/tickets/transitions.ts` o equivalente) llama
`EmailService.send` con el template correspondiente.

## Validaciones Zod

```ts
// src/lib/validators/email-templates.ts (ampliar)
export const ticketInReviewVarsSchema = z.object({
  ticketId: z.string().regex(/^T-\d+$/),
  ticketSubject: z.string().min(1).max(200),
  ticketUrl: z.string().url(),
});

export const ticketClosedVarsSchema = z.object({
  ticketId: z.string().regex(/^T-\d+$/),
  ticketSubject: z.string().min(1).max(200),
  summary: z.array(z.string().min(1).max(280)).max(10),  // últimos N comments
  replyTo: z.string().email(),
  ticketUrl: z.string().url(),
});
```

## Componentes UI

No aplica.

## Flujo de interaccion (secuencial)

1. Admin o sistema cambia estado de ticket: `en_revision` o `closed`.
2. `ticketTransitions.update(...)` recibe `emailService` por DI.
3. Si `to_status === 'en_revision'` → `emailService.send({ template:'ticket_in_review', ... })`.
4. Si `to_status === 'closed'` → carga últimos 5 comments, llama
   `emailService.send({ template:'ticket_closed', vars: { summary, replyTo, ... } })`.
5. Si el ticket no tiene `requester_email`, skip + log warning; no se envía.
6. try/catch aísla el envío; la transición de estado no aborta.

## Capa de servicios

```
src/lib/services/email/templates/
  ticket_in_review.html.ts
  ticket_in_review.txt.ts
  ticket_closed.html.ts
  ticket_closed.txt.ts
```

Registry actualizado con ambos. En
`src/lib/services/tickets/transitions.ts` (creado en T2 si no existe):
- `update(...)` recibe `{ db, emailService, ticketId, toStatus }`.
- Despacha según `toStatus`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/email/templates/ticket-in-review.test.ts` | render normal; varsSchema rechaza `ticketSubject` vacío |
| Unit | `tests/unit/email/templates/ticket-closed.test.ts` | render lista `summary` como `<li>` escapados; varsSchema limita summary a 10 |
| Integracion | `tests/integration/email/tickets.test.ts` | mock `emailService`; transición a `en_revision` → 1 send con template correcto; transición a `closed` → 1 send con summary; ticket sin `requester_email` → 0 sends |

## Dependencias y secuencia

- **Bloqueado por:** HU-17.1, HU-17.2, HU-17.3. REQ-10 (esquema de tickets).
- **Bloquea a:** ninguno.
- **Recursos compartidos:** `src/lib/services/email/templates/index.ts`, `src/lib/services/tickets/transitions.ts`.

## Riesgos tecnicos

- Riesgo: el listado de comments puede contener PII que no queremos en el email → Mitigación: solo se incluye el texto del comment, sin email del autor; Zod limita tamaño.
- Riesgo: `replyTo` se calcula mal y se filtra un email interno → Mitigación: el `replyTo` viene de env (`SUPPORT_REPLY_TO`), no del ticket; test verifica.
- Riesgo: el template `ticket_closed` rompe con `summary` vacío (e.g. ticket cerrado sin comments) → Mitigación: render condicional: si summary.length === 0, ocultar la sección "Resumen".
