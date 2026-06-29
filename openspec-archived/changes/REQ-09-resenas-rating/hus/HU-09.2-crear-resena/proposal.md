# Propuesta — HU-09.2 — Crear reseña con gate por contact_event

**Estado:** propuesta | **REQ padre:** REQ-09-resenas-rating

## Contexto

Para evitar reseñas falsas, sólo vecinos que hayan contactado al prestador (al menos un `contact_event` en REQ-08) pueden dejar reseña. El POST debe ser idempotente en el sentido de falla predecible: si el vecino ya reseñó → 409. La reseña nace con `status='visible'`, `edited_until = created_at + 7 días`, y se inserta en `reviews`. Vinculado a OE1 (engagement) y OE2 (calidad del marketplace).

## Mockups de referencia

- `mockups/profile.html:151-159` — sección "Opiniones" destino de las reseñas creadas.
- `mockups/dashboard-user.html` — panel de "Reseñas dejadas" (referencia; la HU concreta del dashboard es REQ-11).

## Alternativas consideradas

### Opcion A — POST con validación de `contact_event` y UNIQUE en DB
- Endpoint POST `/api/v1/providers/:id/reviews` con `requireSession`, valida Zod, query `contact_events` por `(user_id, provider_id)`, INSERT en `reviews` confiando en UNIQUE para detectar duplicado.
- Pro: la UNIQUE del schema (HU-09.1) es la fuente de verdad para el 409; no race condition entre validación y escritura.
- Pro: simple.
- Contra: hace una query extra para validar el contacto (no es problema, índice lo cubre).

### Opcion B — Validar todo en un solo INSERT con subquery
- `INSERT INTO reviews SELECT ... FROM contact_events WHERE user_id=? AND provider_id=?` y usar el resultado del INSERT para detectar duplicado.
- Pro: una sola query.
- Contra: errores de UNIQUE constraint se mezclan con errores de "no contactó"; UX pierde precisión.
- Contra: Drizzle no soporta bien este patrón con prepared statements.

### Opcion C — Sin gate, sólo captcha
- Cualquier vecino registrado puede reseñar; captcha bloquea bots.
- Pro: menos fricción.
- Contra: abre la puerta a reseñas falsas entre vecinos no relacionados; contradice el criterio de aceptación explícito.

## Decision

Se elige **Opcion A**. La UNIQUE del schema es la fuente de verdad para 409. La validación de `contact_event` se hace en una query aparte, lo que da error claro 403 vs 409. Captcha queda como REQ futuro si el abuso escala.

## Riesgos y mitigaciones

- Riesgo: race condition entre check de contacto e INSERT → Mitigación: usar transacción. Si entre el check y el INSERT el `contact_event` se borra (no debería pasar), la reseña queda; aceptable porque la operación de borrado de contactos no existe en el MVP.
- Riesgo: el body excede 1000 chars → Mitigación: Zod rechaza con 422 ANTES del INSERT.
- Riesgo: el visitante anónimo intenta crear reseña → Mitigación: `requireSession` (no es público); 401 si no hay sesión.
- Riesgo: el usuario tiene rol `provider` o `admin` → Mitigación: el criterio de aceptación dice "vecino autenticado" → validar `role === 'user'`; 403 si no.

## Metrica de exito

- POST con sesión user + contact_event previo + body válido → 201 + fila en `reviews` con `status='visible'` y `edited_until = created_at + 7d`.
- POST sin contact_event → 403 con `error: "debe contactar antes de reseñar"`.
- POST con reseña duplicada (mismo user_id, provider_id) → 409 con `error: "ya reseñó a este prestador"`.
- POST con body de 1500 chars → 422 con error de Zod.
- POST sin sesión → 401.
- POST con sesión provider/admin → 403 con `error: "rol no autorizado"`.
