# Diseno tecnico — HU-14.7 — Donación recurrente mensual MP

**REQ padre:** REQ-14-donaciones-pagos

## Modelo de datos

### Migracion Drizzle

```ts
// src/database/schema.ts (extracto NUEVO)
export const donationSubscriptions = sqliteTable('donation_subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  provider: text('provider', { enum: ['mercadopago'] }).notNull(), // webpay no soporta suscripción
  externalSubscriptionId: text('external_subscription_id').notNull().unique(), // mp preapproval_id
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  payerEmail: text('payer_email'),
  amountClp: integer('amount_clp').notNull(),
  status: text('status', { enum: ['pending', 'authorized', 'cancelled', 'past_due'] }).notNull().default('pending'),
  initialDonationId: integer('initial_donation_id').references(() => donations.id, { onDelete: 'set null' }),
  cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  byExternal: uniqueIndex('uq_donations_sub_external').on(t.externalSubscriptionId),
  byUser: index('idx_donations_sub_user').on(t.userId),
  byStatus: index('idx_donations_sub_status').on(t.status),
}))

// Modificar donations: agregar subscriptionId
// ALTER TABLE donations ADD COLUMN subscription_id INTEGER REFERENCES donation_subscriptions(id) ON DELETE SET NULL;
```

## Contrato de API

### `POST /api/v1/donations/checkout` (extendido de HU-14.2)

- Si `recurring=true` y `provider='mercadopago'`:
  - Server llama a MP `preapproval.create({ reason, auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount, currency_id: 'CLP' }, payer_email, external_reference })`.
  - INSERT `donation_subscriptions` con `status='pending'`, `externalSubscriptionId=<preapproval_id>`.
  - INSERT `donations` con `recurring=true`, `subscription_id=<sub.id>`.
  - Retorna `{ init_point: preapproval.init_point, subscription_id, donation_id }`.

### `POST /api/v1/donations/webhook/mercadopago` (extendido de HU-14.3)

- Si el payload es de tipo `subscription_authorized` o `subscription_payment`:
  - Resuelve la suscripción por `externalSubscriptionId`.
  - Si es `subscription_payment` (cobro mensual): INSERT nueva fila `donations` con `subscription_id`, `status='approved'`.
  - Enqueue email recibo.
- Si es `subscription_cancelled`: UPDATE `donation_subscriptions.status='cancelled'`, `cancelled_at=NOW()`.

### `DELETE /api/v1/donations/subscriptions/:id`

- **Auth:** sesión requerida (vecino autenticado).
- **Response 204:** cancelación exitosa.
- Llama a MP `preapproval.cancel(preapproval_id)` + UPDATE local.

## Validaciones Zod

```ts
// src/lib/validators/donations.ts (extendido)
export const recurringCheckoutSchema = checkoutRequestSchema.extend({
  recurring: z.literal(true),
  provider: z.literal('mercadopago'), // Webpay no soporta
})

// Cancelación: no body, sólo sesión.
```

## Componentes UI

- Modificar `AmountSelector.astro` (HU-14.1) para incluir un toggle "Hacerlo mensual" — al activarlo, `PaymentButtons` cambia el endpoint target a la variante recurring.
- `src/pages/api/v1/donations/subscriptions/[id].ts` — endpoint DELETE.
- `src/components/donations/RecurringBadge.astro` — pequeño badge "Mensual" para mostrar en historial.

## Flujo de interaccion (secuencial)

### Inicio de suscripción
1. Usuario en `/donate`, activa toggle "Mensual".
2. Click "Donar $5.000 mensual con MP" → POST checkout con `recurring=true`.
3. Server crea preapproval en MP, INSERT subscription + donation pending.
4. Usuario completa en MP → MP notifica webhook `subscription_authorized`.
5. Webhook UPDATE `subscription.status='authorized'`. Cobro inicial: INSERT nueva donation approved (o reutiliza la pending).

### Cobro mensual siguiente
1. MP cobra automáticamente cada mes → notifica webhook `subscription_payment`.
2. Webhook resuelve subscription por `externalSubscriptionId`.
3. INSERT nueva `donations` con `subscription_id`, `status='approved'`, `external_id=<nuevo payment_id>`.
4. Enqueue email recibo.

### Cancelación
1. Usuario autenticado GET `/dashboard-user?tab=profile` → ve badge "Donación mensual activa — $5.000" + botón "Cancelar".
2. Click → `DELETE /api/v1/donations/subscriptions/<id>`.
3. Server llama MP cancel + UPDATE local → 204.

## Capa de servicios

```ts
// src/lib/services/payments/mercadopago.ts (firmas adicionales)
export interface MPSubscriptionResult {
  externalSubscriptionId: string
  initPoint: string
}
export async function createMPSubscription(env: Env, input: { amountClp: number; payerEmail: string | null; externalReference: string }): Promise<MPSubscriptionResult>

export async function cancelMPSubscription(env: Env, preapprovalId: string): Promise<void>

// src/lib/services/donations/recurring.ts (firmas)
export async function createRecurringCheckout(env: Env, input: CheckoutInput): Promise<CheckoutResult & { subscriptionId: number }>

export async function cancelSubscription(env: Env, userId: number, subscriptionId: number): Promise<void>
// throws: ForbiddenError si la suscripción no pertenece al usuario; NotFoundError si no existe
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/donations/recurring-schema.test.ts` | `recurring=true` + `provider=mercadopago` válido; `provider=webpay` rechaza |
| Unit | `tests/unit/payments/mp-subscription.test.ts` | Mock MP preapproval OK + cancel OK |
| Integracion | `tests/integration/donations/recurring-create.test.ts` | Subscription creada + donation pending |
| Integracion | `tests/integration/donations/recurring-webhook-payment.test.ts` | Webhook `subscription_payment` → INSERT nueva donation |
| Integracion | `tests/integration/donations/recurring-cancel.test.ts` | DELETE cancela MP + local; usuario distinto → 403 |
| Integracion | `tests/integration/donations/recurring-rbac.test.ts` | Sin sesión DELETE → 401 |
| E2E | `tests/e2e/donate-recurring.spec.ts` | Inicia suscripción → simula 2 cobros → 1 sub + 2 donations; cancela |

## Dependencias y secuencia

- **Bloqueado por:** HU-14.2, HU-14.3 (webhook base), REQ-01 (sesión para cancelar).
- **Bloquea a:** —.
- **Recursos compartidos:** tabla `donations`, SDK MP.

## Riesgos tecnicos

- Riesgo: webhook MP no distingue claramente entre `subscription_payment` y `payment` (cobro inicial) → Mitigación: por el `external_reference` (nuestro `externalSubscriptionId`); si matchea subscription, es cobro recurrente.
- Riesgo: el cobro inicial vs cobros recurrentes es difícil de distinguir → Mitigación: la donation inicial tiene `subscription_id` Y `recurring=true`; cobros mensuales sólo `subscription_id`.
- Riesgo: MP cancela unilateralmente (fraude, fondos) sin notificar → Mitigación: polling diario (job futuro) detecta `past_due` por más de X días y notifica al usuario.
