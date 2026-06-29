# Diseno tecnico — HU-14.8 — Reembolso admin con motivo

**REQ padre:** REQ-14-donaciones-pagos

## Modelo de datos

No introduce tablas. Modifica `donations` para aceptar `status='refunded'` (ya en el enum de HU-14.2) y agrega columna opcional para el motivo:

```ts
// migración aditiva
ALTER TABLE donations ADD COLUMN refund_reason TEXT;
ALTER TABLE donations ADD COLUMN refunded_at INTEGER;
ALTER TABLE donations ADD COLUMN refunded_by INTEGER REFERENCES users(id);
```

## Contrato de API

### `POST /api/v1/admin/donations/:id/refund`

- **Auth:** admin (HU-13.1).
- **Body:** `{ reason: string }` (motivo obligatorio, max 500 chars).
- **Response 200:** `{ ok: true, donation: { id, status: 'refunded' } }`
- **Response 404:** donación no existe.
- **Response 409:** donación en estado no reembolsable (pending, refunded, rejected).
- **Response 422:** `reason` vacío o >500 chars.
- **Response 502:** pasarela falla al ejecutar refund.

## Validaciones Zod

```ts
// src/lib/validators/admin-donations.ts
import { z } from 'zod'

export const refundRequestSchema = z.object({
  reason: z.string().min(3).max(500),
})
```

## Componentes UI

Esta HU es backend puro. Una UI detallada para invocar refund queda fuera de scope (se integrará en la tabla de donaciones de HU-13.5 cuando esa tabla exista). Por ahora, el admin puede usar el endpoint via curl o via extensión futura.

## Flujo de interaccion (secuencial)

1. Admin POST `/api/v1/admin/donations/<id>/refund` con `{ reason }`.
2. Server valida body con `refundRequestSchema`. Si falla → 422.
3. Lee `donations` por id. Si no existe → 404.
4. Si `status !== 'approved'` → 409 con `{ "error": "donación no reembolsable en estado <status>" }`.
5. Según `donation.provider`:
   - `'mercadopago'` → `mpClient.refundPayment(env, donation.externalId, donation.amountClp)`.
   - `'webpay'` → `webpayClient.nullifyTransaction(env, donation.externalId, donation.amountClp)`.
6. Si pasarela OK → UPDATE `donations SET status='refunded', refund_reason=?, refunded_at=NOW(), refunded_by=? WHERE id=?`.
7. `logAdminAction(env, actor.id, 'refund', 'donations', id, before, after)`.
8. Si pasarela falla → 502 + SIN update local.

## Capa de servicios

```ts
// src/lib/services/payments/mercadopago.ts (firmas adicionales)
export async function refundMPPayment(env: Env, paymentId: string, amountClp: number): Promise<void>
// throws: PaymentGatewayError (502)

// src/lib/services/payments/webpay.ts (firmas adicionales)
export async function nullifyWebpayTransaction(env: Env, buyOrder: string, amountClp: number): Promise<void>
// throws: PaymentGatewayError (502)

// src/lib/services/admin/donations-refund.ts (firmas)
export async function refundDonation(env: Env, actorId: number, donationId: number, reason: string): Promise<Donation>
// throws: NotFoundError (404), ConflictError (409), PaymentGatewayError (502)
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/admin-donations/refund-schema.test.ts` | reason vacío rechaza; >500 rechaza |
| Unit | `tests/unit/payments/mp-refund.test.ts` | Mock MP refund OK + error |
| Unit | `tests/unit/payments/webpay-nullify.test.ts` | Mock Webpay nullify OK + error |
| Integracion | `tests/integration/admin/donations-refund-mp.test.ts` | MP refund OK → donations.refunded + audit + refunded_by |
| Integracion | `tests/integration/admin/donations-refund-webpay.test.ts` | Webpay nullify OK → same |
| Integracion | `tests/integration/admin/donations-refund-conflict.test.ts` | status=pending → 409; refunded → 409 |
| Integracion | `tests/integration/admin/donations-refund-validation.test.ts` | reason vacío → 422 |
| Integracion | `tests/integration/admin/donations-refund-rbac.test.ts` | Vecino 403; sin sesión 401 |
| Integracion | `tests/integration/admin/donations-refund-gateway-error.test.ts` | MP error → 502 + SIN update local |
| E2E | `tests/e2e/admin-donations-refund.spec.ts` | Sandbox end-to-end |

## Dependencias y secuencia

- **Bloqueado por:** HU-13.1 (guard), HU-13.7 (audit), HU-14.2 (donations).
- **Bloquea a:** —.
- **Recursos compartidos:** `src/lib/services/payments/`, `admin_audit_log` (HU-13.7).

## Riesgos tecnicos

- Riesgo: el admin no distingue entre pasarelas → Mitigación: el servicio inspecciona `donation.provider` y delega; el admin sólo necesita el `donation.id`.
- Riesgo: race entre dos refunds simultáneos → Mitigación: verificar `status='approved'` DENTRO de la transacción de UPDATE; el segundo se topa con estado cambiado y devuelve 409.
- Riesgo: Webpay `nullify` puede no estar disponible para todas las tarjetas → Mitigación: capturar el error específico de Transbank y devolver 502 con mensaje claro; el admin puede contactar al donante manualmente.
