# Diseno tecnico — HU-17.6 — Template de recibo de donación

**REQ padre:** REQ-17-notificaciones-email

## Modelo de datos

No se introducen tablas. `email_log` (HU-17.2) registra el envío.

## Contrato de API

No se exponen endpoints nuevos. El trigger es interno: REQ-14 llama
`EmailService.send({ template:'donation_receipt', ... })` cuando una
donación es aprobada.

## Validaciones Zod

```ts
// src/lib/validators/email-templates.ts (ampliar)
export const donationReceiptVarsSchema = z.object({
  name: z.string().min(1).max(80),
  amount: z.number().int().positive().max(100_000_000),  // 100M CLP
  donationId: z.string().regex(/^D-\d+$/),
  date: z.coerce.date(),
  receiptUrl: z.string().url(),
});
```

## Componentes UI

No aplica. El helper `formatClp` puede usarse también en la UI de
`/donations` (futuro), pero esa integración queda fuera de scope de esta HU.

## Flujo de interaccion (secuencial)

1. REQ-14 confirma la donación (post-payment webhook).
2. Handler llama `EmailService.send({ template:'donation_receipt', to: donation.payerEmail, vars: { name, amount, donationId, date, receiptUrl }, relatedEntity: `donation:${donationId}` })`.
3. Si `payerEmail` es null → skip + log warning; no se envía.
4. `EmailService.send` valida, render con `formatClp(amount)`, adapter.send, logEmail.

## Capa de servicios

```
src/lib/services/email/templates/
  donation_receipt.html.ts
  donation_receipt.txt.ts
```

```ts
// src/lib/utils/currency.ts (firmas)
export function formatClp(amount: number): string {
  // Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
  // + fallback si el formatter no incluye "CLP"
}
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/utils/currency.test.ts` | `formatClp(5000)` retorna string con `5.000`; `formatClp(0)` lanza o retorna `$0` (decisión); `formatClp(1_000_000)` retorna `1.000.000` |
| Unit | `tests/unit/email/templates/donation-receipt.test.ts` | render normal; renderiza `formattedAmount` (caller pre-calcula); varsSchema rechaza `amount` negativo o decimal |
| Integracion | `tests/integration/email/donation-receipt.test.ts` | donación con `payerEmail` → 1 send con `template:'donation_receipt'`; donación sin `payerEmail` → 0 sends + log |

## Dependencias y secuencia

- **Bloqueado por:** HU-17.1, HU-17.2, HU-17.3. REQ-14 (payment confirmation).
- **Bloquea a:** ninguno.
- **Recursos compartidos:** `src/lib/utils/currency.ts`, `src/lib/services/email/templates/index.ts`.

## Riesgos tecnicos

- Riesgo: el formato `$5.000 CLP` puede no ser lo que el CFO espera (algunos prefieren `CLP 5.000`) → Mitigación: documentar convención en helper; PR review visual del template.
- Riesgo: el `Intl.NumberFormat` retorna `"$5.000"` sin "CLP" en algunos runtimes → Mitigación: post-procesar para añadir sufijo si no está presente.
- Riesgo: la donación puede tener `amount: 0` por error → Mitigación: Zod `positive()` rechaza; test cubre.
