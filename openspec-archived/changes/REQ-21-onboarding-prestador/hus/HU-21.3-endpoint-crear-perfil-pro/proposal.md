# Propuesta — HU-21.3 — Endpoint crear perfil PRO desde wizard

**Estado:** propuesta | **REQ padre:** REQ-21-onboarding-prestador

## Contexto

HU-21.1 dejó el `<form action="/api/v1/providers/me" method="POST">` apuntando a un endpoint que no existe. Esta HU implementa ese handler: recibe el payload completo del wizard (`display_name`, `trade_id` o `trade_pending_approval`, `bio`, `whatsapp`, `base_price_clp`, `commune_ids[]`), normaliza el WhatsApp al formato chileno `+569XXXXXXXX`, persiste `providers` con `status="pending_verification"` y `provider_communes` atómicamente en una transacción D1. Es la pieza que conecta el UI (HU-21.1, HU-21.2) con el modelo de datos y desbloquea el redirect a `/verification` (HU-21.4).

## Mockups de referencia

Sin mockup directo (HU backend). UI referenciada por HU-21.1.

## Alternativas consideradas

### Opción A — Transacción D1 explícita + normalización WhatsApp server-side
- `db.batch([insertProviders, ...insertProviderCommunes])` para atomicidad.
- Helper `normalizeWhatsapp(raw)` con regex chilena: acepta `912345678`, `+56912345678`, `56912345678` y devuelve `+569XXXXXXXX` consistente.
- Pro: una transacción garantiza que si falla el insert de communes no queda un `providers` huérfano sin cobertura.
- Pro: normalización server-side evita inconsistencias entre clientes.
- Contra: D1 batch tiene límite de 50 statements por batch; con 14 comunas por proveedor está dentro del margen, pero documentar el límite.

### Opción B — Dos queries separadas sin transacción
- Pro: más simple de implementar.
- Contra: si falla el segundo INSERT, queda fila huérfana. Riesgo de inconsistencia visible para el prestador.

### Opción C — Validar todo en cliente con HTML5 pattern y normalizar antes del submit
- Pro: menos código server-side.
- Contra: HTML5 pattern no cubre todos los formatos (`912345678` vs `+56912345678` vs `56912345678`); un cliente buggy puede bypasear y persistir inconsistencias.

## Decisión

Se elige **Opción A**. Transacción explícita + normalización centralizada en `src/lib/utils/phone.ts` que también usa REQ-01 (registro con WhatsApp opcional). El helper es testeable unitariamente y reusado.

## Riesgos y mitigaciones

- Riesgo: bio > 500 chars aceptado en cliente (HTML5 `maxlength` es bypassable) → Mitigación: validación Zod `bio.max(500)` server-side devuelve 422.
- Riesgo: `trade_id` puede ser `null` si el usuario eligió "Otro" → Mitigación: aceptar `trade_id: null` + `trade_pending_approval: string` con Zod discriminated union; el handler crea fila en `trades` con `status="pending"` para aprobación admin (futuro).
- Riesgo: user sin verificar email (REQ-20) hace POST → Mitigación: middleware `requireVerifiedEmail` antes del handler devuelve 403.
- Riesgo: race condition si dos submits concurrentes del mismo user → Mitigación: PK en `users.id` y validación previa "no tener provider activo" devuelve 409 Conflict.

## Métrica de éxito

- POST con payload válido devuelve 201 + `{id, status: "pending_verification"}` + 3 filas nuevas en `provider_communes`.
- POST con `whatsapp: "912345678"` persiste como `+56912345678` en D1.
- POST con bio de 600 chars devuelve 422 con `{error: "bio_max_length"}`.
- POST sin email verificado devuelve 403 con `{error: "email no verificado"}`.
- Sabotaje: quitar el `await db.batch([...])` y usar dos queries secuenciales → test con INSERT 3 inválido detecta fila huérfana → restaurar.