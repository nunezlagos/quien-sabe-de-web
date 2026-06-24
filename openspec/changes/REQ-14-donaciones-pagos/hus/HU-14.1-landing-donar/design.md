# Diseno tecnico — HU-14.1 — Landing `/donate` con CTA y montos sugeridos

**REQ padre:** REQ-14-donaciones-pagos

## Modelo de datos

No aplica. Esta HU sólo lee (no introduce tablas).

## Contrato de API

### Reuso de `POST /api/v1/donations/checkout` (HU-14.2)

- Body: `{ provider: 'mercadopago' | 'webpay', amount_clp: number, recurring?: boolean, payer_email?: string }`
- Response 201: `{ init_point: string, external_id: string, donation_id: number }`
- Response 422 si monto < 1000.

### `GET /api/v1/donations/providers`

- Endpoint público nuevo (HU-14.1 lo introduce para que la UI sepa qué pasarelas mostrar).
- Response 200: `{ providers: Array<{ id: 'mercadopago' | 'webpay', enabled: boolean, label: string }> }`

## Validaciones Zod

```ts
// src/lib/validators/donate-landing.ts (cliente)
import { z } from 'zod'

export const SUGGESTED_AMOUNTS_CLP = [3000, 5000, 10000, 25000] as const
export const MIN_DONATION_CLP = 1000
export const MAX_DONATION_CLP = 5_000_000

export const donationAmountSchema = z.number().int().min(MIN_DONATION_CLP).max(MAX_DONATION_CLP)

export const checkoutIntentSchema = z.object({
  provider: z.enum(['mercadopago', 'webpay']),
  amount_clp: donationAmountSchema,
  recurring: z.boolean().optional().default(false),
  payer_email: z.string().email().optional(),
})
```

## Componentes UI

- `src/pages/donate.astro` — landing SSR. Header simple, hero con copy + monto sugerido + selector pasarela, footer idéntico al resto del proyecto.
- `src/components/donations/AmountSelector.astro` — 4 botones con los montos sugeridos (estilo pill, `bg-primary text-white` para el activo) + input numérico "Otro monto" con validación inline.
- `src/components/donations/PaymentButtons.astro` — recibe `providers: ProviderInfo[]` y `amount: number`. Renderiza un botón por provider habilitado.
- `src/components/donations/Hero.astro` — sección superior con copy y CTA principal.

**Mockup TBD**: la composición visual se documenta en `proposal.md` (no hay mockup HTML dedicado). El estilo se alinea con `mockups/transparency.html:42-58` (cards rounded-3xl, paleta verde, íconos Remix). El diseño final se valida con el dueño del producto antes de mergear.

## Flujo de interaccion (secuencial)

1. Visitante GET `/donate` → SSR lee `env.MERCADOPAGO_ACCESS_TOKEN` y `env.WEBPAY_ENV` (config de Wrangler) → arma `providers` array.
2. SSR renderiza landing con `AmountSelector` y `PaymentButtons`.
3. Visitante click "Donar $5.000 con Mercado Pago" → cliente hace `fetch('/api/v1/donations/checkout', { method: 'POST', body: JSON.stringify({ provider: 'mercadopago', amount_clp: 5000 }) })`.
4. Server HU-14.2 crea preferencia MP, fila en `donations`, retorna `init_point`.
5. Cliente hace `window.location.href = init_point` → MP.
6. Visitante completa pago en MP → MP redirige a `/donate/success?donation_id=...` (cubierto por HU-14.3 webhook).

## Capa de servicios

Esta HU no agrega servicios. Los componentes son 100% presentacionales; el fetch va directo al endpoint.

```ts
// src/lib/services/donations/providers.ts (firmas)
export interface ProviderInfo {
  id: 'mercadopago' | 'webpay'
  enabled: boolean
  label: string
}

export async function listEnabledProviders(env: Env): Promise<ProviderInfo[]>
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/donate-landing/amount-schema.test.ts` | <1000 rechaza; >5M rechaza; sugerencias válidas |
| Unit | `tests/unit/donate-landing/listEnabledProviders.test.ts` | Ambos configurados → ambos enabled; sólo MP → MP enabled, Webpay disabled |
| Integracion | `tests/integration/donate-landing/providers-endpoint.test.ts` | GET `/api/v1/donations/providers` retorna el set correcto |
| E2E | `tests/e2e/donate-landing.spec.ts` | 4 montos visibles; click MP inicia checkout; monto inválido bloquea submit |

## Dependencias y secuencia

- **Bloqueado por:** HU-14.2 (endpoint checkout MP) o HU-14.4 (endpoint checkout Webpay). Al menos uno debe estar listo para que la landing tenga al menos un botón.
- **Bloquea a:** — (HU-14.6 recibo y HU-14.7 recurrente son flow post-checkout, no tocan la landing).
- **Recursos compartidos:** `src/components/donations/`, secrets de Wrangler para providers.

## Riesgos tecnicos

- Riesgo: el `listEnabledProviders` corre en SSR y bloquea el render si las secrets no están presentes → Mitigación: try/catch alrededor de cada check; si falla, provider queda disabled (no rompe la página).
- Riesgo: el input numérico "Otro monto" permite pegar texto → Mitigación: `type="number"`, validación Zod en cliente.
- Riesgo: el copy de la landing queda "duro" sin posibilidad de A/B testing → Mitigación: aceptable para v1; flag de copy via settings queda para HU futura.
