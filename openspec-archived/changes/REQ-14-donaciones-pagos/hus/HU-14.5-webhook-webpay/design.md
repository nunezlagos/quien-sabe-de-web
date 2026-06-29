# Diseno tecnico — HU-14.5 — Confirmación Webpay idempotente

**REQ padre:** REQ-14-donaciones-pagos

## Modelo de datos

No introduce tablas. Reusa `donations` (HU-14.2) y `webhook_events_processed` (HU-14.3) con `provider='webpay'`.

## Contrato de API

### `POST /api/v1/donations/webhook/webpay`

- **Auth:** público (verificación contra Transbank).
- **Body:** `{ token_ws: string }`
- **Response 200:** `{ ok: true }` (incluso si ya procesado).
- **Response 401:** Transbank rechaza el token.
- **Response 404:** token sin match en `donations`.

## Validaciones Zod

```ts
// src/lib/validators/donations-webhook.ts (extendido)
export const webpayWebhookPayloadSchema = z.object({
  token_ws: z.string().min(20).max(200),
})
```

## Componentes UI

No aplica. La vista `/donate/success` (HU-14.4) puede invocar internamente este endpoint o leer directamente el estado de `donations`.

## Flujo de interaccion (secuencial)

1. Transbank (o la vista success con el token) POST `/api/v1/donations/webhook/webpay` con `{ token_ws }`.
2. Server llama `WebpayPlus.Transaction.commitTransaction(token_ws)` contra Transbank.
3. Si Transbank retorna error → 401.
4. Lee `donations` por `external_id = token_ws`. Si no existe → 404.
5. INSERT OR IGNORE en `webhook_events_processed (provider='webpay', external_id=token_ws, payload_hash=<sha256(response)>)`.
   - Si `changes() === 0` → ya procesado → 200 no-op.
6. UPDATE `donations SET status='approved' WHERE id=?` (o `rejected` según respuesta Transbank).
7. Si `status='approved'` y `payer_email IS NOT NULL` → enqueue email (HU-14.6).
8. Retorna 200.

## Capa de servicios

```ts
// src/lib/services/payments/webpay.ts (firmas adicionales)
export interface WebpayCommitResult {
  status: 'AUTHORIZED' | 'REJECTED' | 'FAILED'
  amount: number
  buyOrder: string
}
export async function commitWebpayTransaction(env: Env, token: string): Promise<WebpayCommitResult>

// src/lib/services/donations/webhook-webpay.ts (firmas)
export async function handleWebpayWebhook(env: Env, token: string): Promise<{ status: 200 | 401 | 404 }>
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/donations/webpay-webhook-schema.test.ts` | token_ws faltante rechaza; formato OK |
| Unit | `tests/unit/payments/webpay-commit.test.ts` | Mock Transbank: AUTHORIZED → mapea; REJECTED → mapea; SDK error → throws |
| Integracion | `tests/integration/donations/webhook-webpay-approved.test.ts` | Transbank AUTHORIZED → UPDATE + INSERT processed + email |
| Integracion | `tests/integration/donations/webhook-webpay-duplicate.test.ts` | 2x mismo token → 200 + 1 fila processed + 1 email |
| Integracion | `tests/integration/donations/webhook-webpay-rejected.test.ts` | REJECTED → donations.rejected + SIN email |
| Integracion | `tests/integration/donations/webhook-webpay-no-donation.test.ts` | token sin match → 404 |
| Integracion | `tests/integration/donations/webhook-webpay-transbank-error.test.ts` | Transbank error → 401 + cero writes |
| E2E | `tests/e2e/donate-webpay-confirm.spec.ts` | Sandbox Transbank end-to-end |

## Dependencias y secuencia

- **Bloqueado por:** HU-14.2 (tabla `donations`), HU-14.3 (tabla `webhook_events_processed`), HU-14.4 (init Webpay crea la fila pending).
- **Bloquea a:** HU-14.6 (recibo email se encola desde acá también).
- **Recursos compartidos:** `src/lib/services/payments/webpay.ts`, `src/lib/services/email/` (REQ-17).

## Riesgos tecnicos

- Riesgo: la SDK de Transbank `commitTransaction` puede devolver status con valores inesperados según versión → Mitigación: whitelist explícita de status aceptados (`AUTHORIZED`, `SUCCESS` legacy); el resto se trata como rejected.
- Riesgo: el `payload_hash` del webhook puede cambiar entre versiones de la SDK → Mitigación: el hash es secundario (la idempotencia viene de la PK); sólo se usa para detectar payloads distintos con mismo token (caso raro de reintento de Transbank).
- Riesgo: Transbank timeoutea el webhook si tardamos >30s → Mitigación: el processing es <500ms; encolar email en lugar de enviar sincrónico.
