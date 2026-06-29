# Diseno tecnico — HU-14.4 — Checkout Webpay (Transbank)

**REQ padre:** REQ-14-donaciones-pagos

## Modelo de datos

No introduce tablas nuevas. Reusa `donations` (HU-14.2) con `provider='webpay'`.

## Contrato de API

### `POST /api/v1/donations/webpay/init`

- **Auth:** pública.
- **Body:** `{ amount_clp: number, payer_email?: string, recurring?: boolean }`
- **Response 200:**
  ```json
  {
    "form_url": "https://webpay3g.transbank.cl/webpayserver/initTransaction",
    "token": "01ab...",
    "donation_id": 100
  }
  ```
- **Response 422:** monto inválido.
- **Response 502:** Transbank retorna error en init.

### Vista `src/pages/donate/success.astro`

- Después del submit en Webpay, Transbank redirige al `return_url` configurado (que pasaremos en el init) o a `/donate/success?token_ws=<token>`.
- Esta vista dispara la confirmación (`commitTransaction` contra Transbank) y muestra el resultado. La confirmación la cubre HU-14.5 (webhook) pero el return del cliente es la UX visible.

## Validaciones Zod

```ts
// src/lib/validators/donations.ts (extendido)
export const webpayInitRequestSchema = z.object({
  amount_clp: z.number().int().min(MIN_DONATION_CLP).max(MAX_DONATION_CLP),
  payer_email: z.string().email().optional().or(z.literal('')).transform((v) => v || undefined),
  recurring: z.boolean().optional().default(false),
})
```

## Componentes UI

- `src/pages/donate/success.astro` — vista que muestra "Procesando tu donación…" mientras consulta el estado vía el webhook (polling ligero o simplemente confiar en redirect final de Webpay con el estado).
- El componente `PaymentButtons` de HU-14.1 maneja Webpay especialmente: en lugar de redirect simple, genera un `<form>` con `action=<form_url>` + hidden `token_ws` y submitea programáticamente.

## Flujo de interaccion (secuencial)

1. Cliente POST `/api/v1/donations/webpay/init` con `{ amount_clp: 5000 }`.
2. Server valida body.
3. Inicializa SDK Webpay con `WEBPAY_COMMERCE_CODE` y `WEBPAY_API_KEY` (Wrangler secrets).
4. Llama `WebpayPlus.Transaction.initTransaction({ buy_order: <UUID>, session_id: <UUID>, amount: 5000, return_url: 'https://.../donate/success' })`.
5. Si Transbank OK → INSERT `donations` con `provider='webpay'`, `status='pending'`, `external_id=<token>`. Retorna `{ form_url, token, donation_id }`.
6. Si Transbank error → 502, SIN insert.
7. Cliente genera form auto-submit y submitea → usuario en Webpay.
8. Usuario completa pago en Webpay → Webpay redirige a `/donate/success?token_ws=<token>`.

## Capa de servicios

```ts
// src/lib/services/payments/webpay.ts (firmas)
export interface WebpayInitInput {
  amountClp: number
  payerEmail: string | null
  returnUrl: string
}

export interface WebpayInitResult {
  formUrl: string
  token: string
}

export async function initWebpayTransaction(env: Env, input: WebpayInitInput): Promise<WebpayInitResult>
// throws: PaymentGatewayError (502)

// src/lib/services/donations/checkout.ts (extendido)
export async function createWebpayCheckout(env: Env, input: WebpayInitInput, userId: number | null): Promise<CheckoutResult>
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/donations/webpay-init-schema.test.ts` | monto<1000 rechaza; payer_email válido |
| Unit | `tests/unit/payments/webpay-client.test.ts` | Mock SDK: init OK → mapea; SDK throws → PaymentGatewayError |
| Integracion | `tests/integration/donations/webpay-init.test.ts` | Mock Transbank: 200 → fila pending + response; Transbank 500 → 502 sin fila |
| E2E | `tests/e2e/donate-webpay-init.spec.ts` | Click Webpay → form auto-submit → redirect simulado a success |

## Dependencias y secuencia

- **Bloqueado por:** HU-14.2 (tabla `donations`).
- **Bloquea a:** HU-14.5 (webpay webhook confirma con el `token`).
- **Recursos compartidos:** SDK `transbank-sdk` npm, `src/lib/services/donations/checkout.ts`.

## Riesgos tecnicos

- Riesgo: SDK Transbank usa `crypto` de Node que Workers no soporta → Mitigación: usar la rama `@transbank/transbank-sdk` que soporta WebCrypto, o fork con fetch directo.
- Riesgo: el `token` puede colisionar si se hace init concurrente → Mitigación: el token lo genera Transbank; confiamos en su unicidad.
- Riesgo: Webpay redirige a `return_url` pero el usuario cierra la ventana antes → Mitigación: el webhook (HU-14.5) es la fuente de verdad; la UI en `/donate/success` es informativa.
