# Diseno tecnico — HU-14.6 — Email de recibo de donación

**REQ padre:** REQ-14-donaciones-pagos

## Modelo de datos

No introduce tablas. Consume:
- `donations` (HU-14.2) — datos a renderizar.
- `email_log` (REQ-17.7) — UNIQUE `(template, recipient, entity_id)` garantiza dedup.

## Contrato de API

Esta HU no expone endpoints. Su contrato es el comportamiento de envío:

- Cuando `donations.status` pasa a `approved` y `payer_email IS NOT NULL`:
  - `EmailService.enqueue('donation_receipt', { donationId, amountClp, provider, createdAt }, payerEmail)`
  - Enqueue NO bloquea el webhook (fire-and-forget con await corto).
- Cuando NO hay `payer_email`: NO enqueue, `console.info('skip anonymous donation <id>')`.

## Validaciones Zod

```ts
// src/lib/validators/donation-receipt.ts
import { z } from 'zod'

export const donationReceiptContextSchema = z.object({
  donationId: z.number().int().positive(),
  amountClp: z.number().int().positive(),
  provider: z.enum(['mercadopago', 'webpay']),
  createdAt: z.date(),
})
```

## Componentes UI

No aplica. Es backend + template HTML.

Template `src/lib/services/email/templates/donation_receipt.html`:
- Header con logo QuiénSabe.
- Título "¡Gracias por tu donación!".
- Bloque con: monto formateado CLP, número de donación (ID), pasarela usada, fecha.
- Mensaje "Esta donación ayuda a mantener QuiénSabe gratuita para tu comunidad".
- Link a `/transparency` para ver el impacto.
- Footer con datos de contacto y link de desuscripción.

## Flujo de interaccion (secuencial)

1. Webhook MP (HU-14.3) o Webpay (HU-14.5) confirma donación.
2. Después de UPDATE de `donations`, el servicio llama `EmailService.enqueue`.
3. `EmailService.enqueue`:
   - Renderiza el template con el contexto validado.
   - INSERT en `email_log (template, recipient, entity_id, status='queued', payload_json)`.
   - Si UNIQUE violation → `console.warn('duplicate receipt <donationId>, skipped')` y retorna.
   - Push a la cola interna (KV o Durable Object, según REQ-17).
4. Worker de email (REQ-17) procesa la cola y envía via SES.

## Capa de servicios

```ts
// src/lib/services/email/donation-receipt.ts (firmas)
import type { EmailService } from '@/lib/services/email'

export async function enqueueDonationReceipt(
  env: Env,
  donation: { id: number; amountClp: number; provider: 'mercadopago' | 'webpay'; payerEmail: string | null; createdAt: Date },
): Promise<void>
// throws: si `donation.payerEmail === null` → no-op (return sin error)
// throws: si EmailService.enqueue throws → log warning, no propaga
```

Reuso: `EmailService.enqueue(template, context, recipient)` de REQ-17.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/email/donation-receipt-schema.test.ts` | Context valid; provider enum; amount positivo |
| Unit | `tests/unit/email/donation-receipt-template.test.ts` | Render con contexto → placeholders sustituidos; CLP formateado |
| Integracion | `tests/integration/donations/receipt-email.test.ts` | Donación approved con email → fila en email_log; sin email → no fila; duplicado → no duplica
| Integracion | `tests/integration/donations/receipt-anonymous.test.ts` | Anónimo confirmado → log info "skip anonymous", no fila en email_log
| E2E | `tests/e2e/donate-receipt.spec.ts` | Mailpit recibe email con HTML correcto y datos correctos |

## Dependencias y secuencia

- **Bloqueado por:** HU-14.3 + HU-14.5 (los webhooks disparan), REQ-17 (`EmailService.enqueue` + `email_log`).
- **Bloquea a:** —.
- **Recursos compartidos:** `src/lib/services/email/`, tabla `email_log`.

## Riesgos tecnicos

- Riesgo: el template no se carga en runtime (path relativo mal) → Mitigación: tests con import explícito + verificación del contenido renderizado.
- Riesgo: el formateo CLP puede usar separadores distintos entre template y UI → Mitigación: helper único `formatCLP` en `src/lib/utils/format.ts` reutilizado por HU-13.5.
- Riesgo: si `EmailService.enqueue` falla por SES down, el webhook podría propagar error → Mitigación: try/catch alrededor de la llamada; log warning; webhook retorna 200 igualmente.
