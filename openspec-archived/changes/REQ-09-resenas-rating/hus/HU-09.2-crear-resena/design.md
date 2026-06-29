# Diseno tecnico — HU-09.2 — Crear reseña con gate por contact_event

**REQ padre:** REQ-09-resenas-rating

## Modelo de datos

Depende de:
- `users` (REQ-01).
- `providers` (REQ-04).
- `contact_events` (REQ-08 / HU-08.1).
- `reviews` (HU-09.1).

No introduce tablas. INSERT en `reviews`:

```sql
INSERT INTO reviews (provider_id, user_id, rating, body, status, created_at, edited_until)
VALUES (
  :providerId,
  :userId,
  :rating,
  :body,
  'visible',
  :nowSec,
  :nowSec + 604800  -- 7 días
);
```

## Contrato de API

| Endpoint | Método | Auth | Path | Request body | Response 201 | Errores |
|---|---|---|---|---|---|---|
| `/api/v1/providers/:id/reviews` | POST | sesión user | `id` numérico | `{ rating: 1-5, body?: string <= 1000 }` | `{ id, rating, body, status, createdAt, editedUntil }` | 401 (sin sesión), 403 (sin contacto previo O rol ≠ user), 404 (provider no existe), 409 (ya reseñó), 422 (Zod) |

## Validaciones Zod

```ts
// src/lib/validators/reviews.ts (firmas)
export const reviewCreateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(1).max(1000).optional(),
});

// params (path)
export const providerIdParamSchema = z.coerce.number().int().positive();
```

## Componentes UI

No aplica en esta HU. La UI de creación vive en `mockups/profile.html:151-159` y se materializa en HU futura (botón "Dejar reseña" en perfil autenticado); esta HU es sólo el endpoint.

(Decisión: el botón de creación se implementa en REQ-11 / REQ-12 cuando el visitante esté autenticado. Esta HU deja el endpoint listo.)

## Flujo de interaccion (secuencial)

1. Cliente autenticado envía `POST /api/v1/providers/<id>/reviews` con `{ rating, body? }`.
2. Handler en `src/pages/api/v1/providers/[id]/reviews.ts` (POST, mismo archivo que GET de HU-07.4 con método discriminado):
   a. `requireSession(Astro)` → 401 si falla.
   b. Validar `Astro.locals.session.user.role === 'user'` → 403 si no.
   c. Validar `providerId` con `providerIdParamSchema` → 400 si falla; verificar provider existe → 404 si no.
   d. Validar body con `reviewCreateSchema` → 422 si falla.
   e. `hasContactedProvider(env, userId, providerId)`:
      - `SELECT 1 FROM contact_events WHERE user_id = ? AND provider_id = ? LIMIT 1`.
      - Si vacío → 403.
   f. En transacción:
      - INSERT en `reviews` con `edited_until = now + 7d`.
      - Si el INSERT falla por UNIQUE → 409.
   g. Devolver `successResponse(row, 201)`.
3. Cliente recibe 201; el listado en HU-07.4 se actualiza al recargar.

## Capa de servicios

- `src/lib/services/reviews.ts` (extender, firma de HU-09.1):
  - `hasContactedProvider(env, userId, providerId): Promise<boolean>` — query a `contact_events`.
  - `createReview(env, input): Promise<PublicReview>` — INSERT + SELECT para devolver fila completa.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/reviews.test.ts` (extender) | `reviewCreateSchema`: rating 1-5 OK; rating 0 falla; rating 6 falla; body 1001 chars falla; body vacío (ausente) OK |
| Unit | `tests/unit/services/reviews.test.ts` (extender) | `hasContactedProvider` con DB mock: true/false; `createReview` calcula `edited_until = now + 7d` |
| Integración | `tests/integration/reviews/create.test.ts` | 201 con contact_event previo; 403 sin contact_event; 409 duplicado; 422 body largo; 401 sin sesión; 403 con rol provider; 404 provider inexistente; `edited_until` exactamente 7d después |

## Dependencias y secuencia

- **Bloqueado por:** HU-09.1 (schema), HU-08.1 (tabla `contact_events`).
- **Bloquea a:** HU-09.3 (PATCH asume reseña creada), HU-07.4 (lista), HU-09.5 (cálculo de promedio).
- **Recursos compartidos:** `requireSession`, binding D1, `Astro.locals.session`.

## Riesgos tecnicos

- Riesgo: la sesión cacheada en KV no refleja rol actualizado tras admin cambiar rol → Mitigación: chequeo contra DB cada vez (1 query extra); aceptable.
- Riesgo: race entre check de contacto e INSERT de review (borrado de contact_event) → Mitigación: el INSERT de reseña no depende del contact_event después del check; si el contact_event se borra entre medio, la reseña queda y se acepta el trade-off.
- Riesgo: si `body` opcional no se valida en DB (es nullable), pero el Zod rechaza vacío → Mitigación: aceptar `body: undefined` como "sin comentario"; el Zod actual ya lo permite.
- Riesgo: `edited_until` calculado en el servidor puede quedar en pasado si el reloj del worker está desincronizado → Mitigación: usar `Date.now()` del request (clock del worker); documentar dependencia.
