# Diseno tecnico — HU-14.2 — Checkout Mercado Pago

**REQ padre:** REQ-14-donaciones-pagos

## Modelo de datos

### Migracion Drizzle

```ts
// src/database/schema.ts (extracto)
export const donations = sqliteTable('donations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  provider: text('provider', { enum: ['mercadopago', 'webpay'] }).notNull(),
  externalId: text('external_id').notNull().unique(), // preference_id o buy_order
  amountClp: integer('amount_clp').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'refunded', 'abandoned'] }).notNull().default('pending'),
  payerEmail: text('payer_email'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }), // null si anónimo
  recurring: integer('recurring', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  byExternal: uniqueIndex('uq_donations_external').on(t.externalId),
  byStatus: index('idx_donations_status').on(t.status),
  byCreatedAt: index('idx_donations_created').on(t.createdAt),
  // CHECK: amount_clp >= 1000
}))
```

## Contrato de API

### `POST /api/v1/donations/checkout`

- **Auth:** pública (donación anónima OK; si hay sesión, se asocia `user_id`).
- **Body:**
  ```json
  {
    "provider": "mercadopago",
    "amount_clp": 5000,
    "recurring": false,
    "payer_email": "juan@ejemplo.cl"
  }
  ```
- **Response 201:**
  ```json
  {
    "init_point": "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=...",
    "external_id": "MP-123456",
    "donation_id": 99
  }
  ```
- **Response 422:** `{ "error": "monto mínimo 1000" }` o detalle Zod.
- **Response 502:** `{ "error": "error pasarela" }` si MP responde 5xx.

## Validaciones Zod

```ts
// src/lib/validators/donations.ts
import { z } from 'zod'

export const MIN_DONATION_CLP = 1000
export const MAX_DONATION_CLP = 5_000_000

export const donationProviderSchema = z.enum(['mercadopago', 'webpay'])

export const checkoutRequestSchema = z.object({
  provider: donationProviderSchema,
  amount_clp: z.number().int().min(MIN_DONATION_CLP).max(MAX_DONATION_CLP),
  recurring: z.boolean().optional().default(false),
  payer_email: z.string().email().optional().or(z.literal('')).transform((v) => v || undefined),
})
```

## Componentes UI

No aplica — endpoint server-side, sin UI propia.

## Flujo de interaccion (secuencial)

1. Cliente POST `/api/v1/donations/checkout`.
2. Server valida body con `checkoutRequestSchema`. Si falla → 422.
3. Si `provider !== 'mercadopago'` → 422 (este endpoint sólo maneja MP; Webpay usa su propio endpoint en HU-14.4).
4. Inicializa SDK MP con `MERCADOPAGO_ACCESS_TOKEN`.
5. Llama `preference.create({ items: [{ title: 'Donación QuiénSabe', quantity: 1, unit_price: amount_clp, currency_id: 'CLP' }], payer: { email: payer_email }, external_reference: <UUIDv4> })`.
6. Si MP devuelve error 5xx → retornar 502 sin insertar fila.
7. INSERT en `donations` con `status='pending'`, `external_id=<preference.id>`, `amount_clp`, `payer_email` (o null), `user_id` (de sesión si hay), `recurring`.
8. Retorna 201 con `{ init_point: preference.init_point, external_id, donation_id }`.

## Capa de servicios

```ts
// src/lib/services/payments/mercadopago.ts (firmas)
export interface MPCheckoutInput {
  amountClp: number
  payerEmail: string | null
  externalReference: string
}

export interface MPCheckoutResult {
  externalId: string // preference.id
  initPoint: string
}

export async function createMPCheckout(env: Env, input: MPCheckoutInput): Promise<MPCheckoutResult>
// throws: PaymentGatewayError (mapea a 502)

// src/lib/services/donations/checkout.ts (firmas)
export interface CheckoutInput {
  provider: 'mercadopago' | 'webpay'
  amountClp: number
  payerEmail: string | null
  userId: number | null
  recurring: boolean
}

export interface CheckoutResult {
  donationId: number
  externalId: string
  initPoint: string
}

export async function createDonationCheckout(env: Env, input: CheckoutInput): Promise<CheckoutResult>
// throws: ValidationError (422), PaymentGatewayError (502)
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/donations/checkout-schema.test.ts` | amount<1000 rechaza; payer_email vacío → null; provider inválido rechaza |
| Unit | `tests/unit/payments/mp-client.test.ts` | Mock SDK: response normal → mapea a MPCheckoutResult; SDK error → throws PaymentGatewayError |
| Integracion | `tests/integration/donations/checkout-mp.test.ts` | Mock MP: 201 con init_point + fila en donations pending; MP 500 → 502 sin fila; anónimo sin payer_email |
| Integracion | `tests/integration/donations/checkout-fk.test.ts` | user_id válido → FK; user_id null → OK (anónimo) |
| E2E | `tests/e2e/donate-checkout-mp.spec.ts` | Click en landing → POST → redirect a init_point simulado |

## Dependencias y secuencia

- **Bloqueado por:** — (no depende de otras HUs de REQ-14; sólo de REQ-01 para sesiones).
- **Bloquea a:** HU-14.1 (landing consume este endpoint), HU-14.3 (webhook confirma con external_id).
- **Recursos compartidos:** tabla `donations` (esta HU la crea), SDK `mercadopago` npm.

## Riesgos tecnicos

- Riesgo: el SDK MP requiere Node 18+ y puede romper en Workers runtime → Mitigación: verificar compatibilidad al instalar; si no, usar `fetch` directo a la REST API con helper propio.
- Riesgo: race entre INSERT de `donations` y respuesta del cliente → Mitigación: el INSERT ocurre DESPUÉS de recibir `preference.id` de MP; si la respuesta se pierde, queda fila huérfana que el job de limpieza diario cierra.
- Riesgo: el usuario edita el monto en el cliente entre el POST y el redirect → Mitigación: MP recibe el monto en la preferencia (server-authoritative); no editable en cliente.
