# Propuesta — HU-14.7 — Donación recurrente mensual MP

**Estado:** propuesta | **REQ padre:** REQ-14-donaciones-pagos

## Contexto

Donantes regulares quieren aportar mensualmente sin tener que iniciar checkout cada vez. MP soporta suscripciones (preapproval) con cobros automáticos mensuales. Esta HU agrega el endpoint para iniciar la suscripción (`recurring=true` en checkout MP), el webhook extendido que reconoce cobros mensuales de suscripciones existentes (cada cobro genera una nueva fila `donations` ligada a la suscripción), y el endpoint para cancelar.

## Mockups de referencia

No hay mockup específico de recurrente. La UI se integra como una variante del checkout (toggle "mensual" en `AmountSelector` de HU-14.1).

## Alternativas considered

### Opcion A — Tabla `donation_subscriptions (id, mp_preapproval_id, user_id?, amount_clp, status, created_at, cancelled_at?)` + creación vía MP preapproval
- Una fila por suscripción. Cada cobro mensual es una nueva fila `donations` con `subscription_id` apuntando acá.
- Pro: modelado natural; cancelar es UPDATE simple.
- Pro: queries agregadas "todas las suscripciones activas" son directas.
- Contra: requiere endpoint de cancelación separado.

### Opcion B — Reusar `donations` con flag `recurring=true` y un campo `parent_donation_id` para cobros posteriores
- Pro: cero tabla nueva.
- Contra: los cobros mensuales no son "children" semánticamente; queries agregadas se vuelven complejas.

### Opcion C — Suscripciones manejadas enteramente en MP, sin reflejo local
- Pro: cero código de storage.
- Contra: no podemos consultar suscripciones propias del usuario sin llamar a MP; perdemos cancelaciones locales rápidas.

## Decision

Se elige **Opcion A**. Tabla `donation_subscriptions` con FK opcional a `users(id)` y FK opcional a `donations(id)` para la suscripción inicial. Cada webhook de MP puede ser: nuevo cobro de suscripción (crea nueva fila `donations` ligada), cancelación (UPDATE `status='cancelled'`), o rechazo (UPDATE `status='past_due'`).

## Riesgos y mitigaciones

- Riesgo: el donante olvida que tiene suscripción activa → Mitigación: el recibo mensual incluye "Donación recurrente — cancela en X link".
- Riesgo: la suscripción queda activa al cerrar la cuenta del usuario → Mitigación: `onDelete` para `user_id` es `SET NULL`; mantenemos la suscripción en MP pero perdemos visibilidad local (limitación aceptable; documentar al usuario al cancelar cuenta).
- Riesgo: cobros rechazados por fondos insuficientes se acumulan → Mitigación: después de N rechazos consecutivos, marcar `subscription.status='past_due'` y NO encolar email de recibo; HU-14.6 extendido (fuera de scope).

## Metrica de exito

- POST `/api/v1/donations/checkout` con `recurring=true` → 201 con `init_point` de preapproval MP + fila en `donation_subscriptions` con `status='pending'`.
- Webhook MP notifica cobro mensual → INSERT nueva `donations` con `subscription_id` apuntando a la suscripción.
- DELETE `/api/v1/donations/subscriptions/<id>` con sesión → cancela en MP + `subscription.status='cancelled'`.
- E2E: usuario inicia suscripción → simular 2 cobros mensuales → DB tiene 1 subscription + 2 donations.
