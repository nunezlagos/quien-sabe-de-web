# Propuesta — HU-17.6 — Template de recibo de donación

**Estado:** propuesta | **REQ padre:** REQ-17-notificaciones-email

## Contexto

Tras una donación aprobada, el donante debe recibir un recibo claro con el
monto en CLP formateado (separador de miles con punto, sufijo "CLP"). El
recibo es la constancia del aporte y cumple un rol de "comprobante" para
quienes llevan registro personal. Si la donación es anónima (sin
`payer_email`), no se envía nada. Esta HU también introduce el helper
`formatClp(value)` que se reutilizará en la UI de `/donations` y en el
dashboard admin (REQ-13).

## Mockups de referencia

- `mockups/about.html:67-95` — opciones de donación con montos en CLP
  formateados (`$2.000`, `$5.000`, `$10.000`); el helper de formato debe
  producir exactamente este rendering.

## Alternativas consideradas

### Opcion A — Helper `formatClp` + template `donation_receipt`
- `formatClp(amount: number): string` usa `Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 })`.
- Template `donation_receipt.html.ts` con vars `{ name, amount, formattedAmount, donationId, date }`.
- Pro: helper reusable, locale-aware, sin dependencia externa.
- Contra: `Intl.NumberFormat` con `currency:'CLP'` puede no incluir el sufijo "CLP" en algunos runtimes; verificar.

### Opcion B — Format manual con regex
- `(n).toLocaleString('es-CL') + ' CLP'`.
- Pro: control total del formato.
- Contra: reinventar la rueda; inconsistente con la API estándar.

### Opcion C — Usar `dinero.js` o similar
- Librería especializada en money.
- Pro: robusta para arithmetic.
- Contra: overkill; no estamos haciendo arithmetic de dinero en el template.

## Decision

Se elige **Opcion A**. `Intl.NumberFormat` con fallback manual si la
representación no incluye "CLP". El helper vive en
`src/lib/utils/currency.ts` para reuso.

## Riesgos y mitigaciones

- Riesgo: runtime edge (Cloudflare Workers) sin `Intl.NumberFormat` con `es-CL` → Mitigación: `Intl` está disponible en workerd; tests cubren el formato esperado y un fallback.
- Riesgo: el monto se envía como número con decimales (5000.5) y el template no sabe truncar → Mitigación: Zod acepta `amount: z.number().int().positive()`; el caller trunca antes de pasar.
- Riesgo: el recibo se envía antes de confirmar la donación (race con payment provider) → Mitigación: el trigger es la confirmación (REQ-14), no la creación.

## Metrica de exito

- Donación de $5000 → recibo con texto "$5.000 CLP" en el cuerpo.
- Donación anónima (sin `payer_email`) → 0 sends + log.
- `formatClp(5000)` retorna `"$5.000"` o `"$5.000 CLP"` según el formatter; test asserta con `toContain('5.000')`.
