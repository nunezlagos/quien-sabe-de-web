# Propuesta — HU-14.2 — Checkout Mercado Pago

**Estado:** propuesta | **REQ padre:** REQ-14-donaciones-pagos

## Contexto

Esta HU implementa el endpoint que crea la preferencia de pago en Mercado Pago y registra la donación en estado `pending`. Es el primer eslabón del flujo de donación con MP: la landing (HU-14.1) hace POST, MP devuelve `init_point`, el cliente redirige al usuario, MP notifica al webhook (HU-14.3) que confirma el pago. La HU incluye el schema de la tabla `donations`, el cliente SDK de MP, validación Zod, manejo de errores (MP 500 → 502 al cliente) y la rama de donación anónima (sin `payer_email`).

## Mockups de referencia

No hay mockup de checkout MP. La redirección sale del sistema hacia la UI de MP. El endpoint sólo retorna JSON.

## Alternativas considered

### Opcion A — Cliente MP vía SDK `mercadopago` (oficial npm) + tabla `donations` con `status` enum
- SDK oficial genera la preferencia, devuelve `init_point`.
- Pro: SDK battle-tested; cubre autenticación, retries, tipos.
- Pro: schema normalizado permite HU-14.3 confirmar con `external_id` y HU-14.6 mandar recibo con `payer_email`.
- Contra: SDK pesa ~200KB (acceptable en server, no en cliente).

### Opcion B — Cliente MP via fetch directo a su REST API sin SDK
- Pro: bundle más liviano; control total.
- Contra: re-implementar auth, retries, tipos; muy poco beneficio real.

### Opcion C — Stripe en vez de MP
- Pro: API más limpia.
- Contra: MP es la pasarela dominante en Chile; el cliente lo pidió explícitamente en el REQ.

## Decision

Se elige **Opcion A**. SDK oficial MP (`mercadopago` npm) + tabla `donations` con campos mínimos (`provider`, `external_id`, `amount_clp`, `status`, `payer_email?`, `recurring`, `user_id?`, `created_at`, `updated_at`). El SDK vive en server-only code (no entra al bundle del cliente).

## Riesgos y mitigaciones

- Riesgo: el SDK MP puede cambiar breaking changes entre versiones → Mitigación: pinear versión exacta en `package.json`; tests integration con fixtures (mock MP).
- Riesgo: la fila `donations` se crea ANTES de confirmar con MP → si el usuario cierra la ventana, queda fila `pending` huérfana → Mitigación: job de limpieza diario marca `pending > 24h` como `abandoned` (HU-14.x fuera de scope; documentado).
- Riesgo: credenciales MP en código → Mitigación: `MERCADOPAGO_ACCESS_TOKEN` como secret de Wrangler; nunca en código ni en KV pública.

## Metrica de exito

- POST `{"provider":"mercadopago","amount_clp":5000}` → 201 con `{ init_point, external_id, donation_id }` + fila en `donations` con `status="pending"`.
- POST con `amount_clp: 500` → 422 con `{ "error": "monto mínimo 1000" }`.
- POST sin `payer_email` → 201 con `payer_email=null`.
- Mock MP devuelve 500 → endpoint retorna 502 + NO crea fila.
- E2E: usuario inicia checkout → redirige a `init_point` simulado.
