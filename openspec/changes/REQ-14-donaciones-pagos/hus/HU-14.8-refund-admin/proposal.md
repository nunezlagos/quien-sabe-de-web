# Propuesta — HU-14.8 — Reembolso admin con motivo

**Estado:** propuesta | **REQ padre:** REQ-14-donaciones-pagos

## Contexto

El admin debe poder reembolsar una donación aprobada, con motivo obligatorio (auditoría y compliance). El reembolso involucra: (1) llamar a la API de la pasarela correspondiente (MP `payments.refund` o Webpay `nullify`), (2) actualizar el estado local, (3) auditar (HU-13.7). Sólo aplica a donaciones `approved` (no se puede reembolsar `pending` ni `refunded` ya). La acción es destructiva y queda registrada con snapshot before/after.

## Mockups de referencia

No hay mockup de reembolso. La acción vive en la sección de finanzas admin (HU-13.5): en la tabla de donaciones (extensión futura) o desde un detalle de donación (extensión futura). Por ahora, un endpoint simple con motivo es suficiente; UI detallada queda para HU futura.

## Alternativas considered

### Opcion A — Endpoint admin `POST /api/v1/admin/donations/:id/refund` con motivo + integración pasarela + audit
- Un endpoint que orquesta: validar estado, llamar a pasarela, UPDATE local, audit log.
- Pro: simple; una sola URL para auditoría.
- Pro: el admin puede usar curl o la UI futura indistintamente.
- Contra: requiere el admin conocer el `id` o buscarlo en otra pantalla.

### Opcion B — Action específica por pasarela: `POST /admin/donations/:id/refund-mp` vs `refund-webpay`
- Pro: URLs explícitas.
- Contra: el admin tiene que saber la pasarela; ruido innecesario.

### Opcion C — Reembolso vía un servicio externo (Stripe Connect, etc.)
- Pro: más simple si todas las donaciones van por una sola pasarela.
- Contra: hoy tenemos MP y Webpay; este diseño no encaja.

## Decision

Se elige **Opcion A**. Un endpoint admin decide la pasarela según `donation.provider` y llama al refund correspondiente. El motivo es obligatorio y se almacena en `admin_audit_log` (entity='donations', before/after incluye `status` y `refund_reason`).

## Riesgos y mitigaciones

- Riesgo: la API de la pasarela falla → Mitigación: si falla, NO se actualiza la donación local; se devuelve 502. El admin reintenta.
- Riesgo: reembolso parcial (Webpay permite monto; MP también) → Mitigación: v1 sólo reembolso total. Parcial queda para HU futura.
- Riesgo: refund MP tarda horas en confirmarse → Mitigación: aceptar la incertidumbre; el admin recibe 200 inmediato; el estado final puede llegar via webhook (manejado en HU-14.3/14.5 si MP notifica refund como evento).

## Metrica de exito

- POST `/api/v1/admin/donations/<id>/refund` con `{"reason":"error donante"}` sobre donación `approved` → 200, `donations.status='refunded'`, fila en `admin_audit_log`, refund en pasarela.
- Reembolso de donación ya `refunded` → 409.
- Motivo vacío → 422.
- Vecino intentando refund → 403.
- E2E: admin ejecuta refund → MP sandbox confirma → donación queda refunded localmente.
