# Diseno tecnico — HU-14.3 — Webhook Mercado Pago idempotente

**REQ padre:** REQ-14-donaciones-pagos

## Modelo de datos

### Migracion Drizzle

```ts
// src/database/schema.ts (extracto)
export const webhookEventsProcessed = sqliteTable('webhook_events_processed', {
  provider: text('provider', { enum: ['mercadopago', 'webpay'] }).notNull(),
  externalId: text('external_id').notNull(),
  payloadHash: text('payload_hash').notNull(), // SHA-256 hex del body, para detectar payload distinto mismo ID
  processedAt: integer('processed_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  pk: primaryKey({ columns: [t.provider, t.externalId] }),
}))
```

PK compuesta `(provider, external_id)` garantiza idempotencia atómica vía `INSERT OR IGNORE`.

## Contrato de API

### `POST /api/v1/donations/webhook/mercadopago`

- **Auth:** público (verificación por HMAC).
- **Headers requeridos:** `x-signature: <hmac>`, `x-request-id: <uuid>`.
- **Body:** payload JSON de MP con `data.id` (notification id), `type: 'payment'`, etc.
- **Response 200:** `{ ok: true }` (incluso si ya procesado, para que MP no reintente).
- **Response 401:** HMAC inválido.
- **Response 404:** no hay donación matcheable para el `external_id`.

## Validaciones Zod

```ts
// src/lib/validators/donations-webhook.ts
import { z } from 'zod'

export const mpWebhookPayloadSchema = z.object({
  type: z.string(), // 'payment' en este caso
  data: z.object({
    id: z.string(), // notification id; para obtener el payment hay que llamar a MP API
  }),
})
```

## Componentes UI

No aplica.

## Flujo de interaccion (secuencial)

1. MP POST webhook.
2. Server lee header `x-signature` y body raw.
3. Verifica HMAC con `MERCADOPAGO_WEBHOOK_SECRET`:
   ```
   expected = HMAC_SHA256(rawBody, secret)
   if !timingSafeEqual(expected, received) → return 401
   ```
4. Parsea payload → obtiene `data.id` (notification_id).
5. Llama a MP API `GET /v1/notifications/<id>` para obtener el payment con `external_reference` (nuestro `external_id` de la fila `donations`) y `status`.
6. INSERT OR IGNORE en `webhook_events_processed (provider='mercadopago', external_id=<payment.id>, payload_hash=<sha256(payment)>)`.
   - Si `changes() === 0` → ya procesado → return 200 no-op.
7. UPDATE `donations SET status='approved'|'rejected', updated_at=NOW() WHERE external_id=?`.
8. Si `status='approved'` y `payer_email IS NOT NULL` → enqueue email via `EmailService.send('donation_receipt', {...}, payer_email)` (HU-14.6).
9. Retorna 200.

## Capa de servicios

```ts
// src/lib/services/payments/mp-hmac.ts (firmas)
export async function verifyMPWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean>

// src/lib/services/payments/mercadopago.ts (firmas adicionales)
export interface MPPaymentDetails {
  externalId: string // nuestro external_reference
  status: 'approved' | 'rejected' | 'pending' | 'in_process'
  paymentId: string
}
export async function getMPPaymentDetails(env: Env, notificationId: string): Promise<MPPaymentDetails>

// src/lib/services/donations/webhook-mp.ts (firmas)
export async function handleMPWebhook(env: Env, rawBody: string, signature: string): Promise<{ status: 200 | 401 | 404 }>
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/payments/mp-hmac.test.ts` | HMAC válido OK; firma alterada falla; body alterado falla |
| Unit | `tests/unit/payments/mp-payload-schema.test.ts` | Payload malformado rechaza |
| Integracion | `tests/integration/donations/webhook-mp-hmac.test.ts` | HMAC inválido → 401 + SIN writes |
| Integracion | `tests/integration/donations/webhook-mp-approved.test.ts` | HMAC válido + approved → donations updated + email encolado + fila en processed |
| Integracion | `tests/integration/donations/webhook-mp-duplicate.test.ts` | Mismo webhook 2x → 200 + 1 sola fila en processed + 1 email |
| Integracion | `tests/integration/donations/webhook-mp-rejected.test.ts` | status=rejected → donations.rejected + SIN email |
| Integracion | `tests/integration/donations/webhook-mp-no-donation.test.ts` | external_id sin match → 404 |
| E2E | `tests/e2e/donate-webhook-mp.spec.ts` | Sandbox MP: donation completa → webhook → email llega |

## Dependencias y secuencia

- **Bloqueado por:** HU-14.2 (tabla `donations`, fila pending).
- **Bloquea a:** HU-14.6 (recibo email se encola desde acá).
- **Recursos compartidos:** `src/lib/services/email/` (REQ-17), `src/lib/services/payments/mercadopago.ts`.

## Riesgos tecnicos

- Riesgo: la verificación HMAC usa `timingSafeEqual` y el header de MP viene en base64 → Mitigación: convertir ambos a Buffer antes de comparar.
- Riesgo: el INSERT OR IGNORE y el UPDATE de donation no son atómicos → Mitigación: ejecutar ambos en una sola transacción D1 (`db.batch([...])`).
- Riesgo: el payload `data.id` puede no corresponder al payment id real → Mitigación: siempre llamar a MP API para resolver el payment; nunca confiar en el payload crudo.
