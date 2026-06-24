# Diseno tecnico — HU-09.6 — Moderación admin: ocultar reseña con motivo

**REQ padre:** REQ-09-resenas-rating

## Modelo de datos

UPDATE sobre `reviews` + INSERT en `admin_audit_log` (REQ-13). Transacción:

```sql
BEGIN;
UPDATE reviews
SET status = 'hidden', hidden_reason = :reason
WHERE id = :id;

INSERT INTO admin_audit_log (actor_id, event, target_kind, target_id, reason, created_at)
VALUES (:adminId, 'review_hidden', 'review', :id, :reason, :nowSec);
COMMIT;
```

Si la reseña ya estaba `hidden`, el UPDATE no cambia filas pero el INSERT sí; eso es idempotente y auditable.

## Contrato de API

| Endpoint | Método | Auth | Path | Request body | Response 200 | Errores |
|---|---|---|---|---|---|---|
| `/api/v1/admin/reviews/:id/hide` | PATCH | sesión admin | `id` numérico | `{ reason: string 1..200 }` | `{ id, status, hiddenReason }` | 401 (sin sesión), 403 (rol ≠ admin), 404 (reseña no existe), 422 (motivo vacío) |

## Validaciones Zod

```ts
// src/lib/validators/admin.ts
export const reviewHideSchema = z.object({
  reason: z.string().min(1).max(200),
});
```

## Componentes UI

No aplica en esta HU. El endpoint es el entregable. La UI en `dashboard-admin.html` con tabla de reseñas a moderar se materializa en REQ-13.

## Flujo de interaccion (secuencial)

1. Admin autenticado envía `PATCH /api/v1/admin/reviews/<id>/hide` con `{ reason }`.
2. Handler en `src/pages/api/v1/admin/reviews/[id]/hide.ts`:
   a. `requireAdmin(Astro)` → 401 / 403.
   b. Validar body con `reviewHideSchema` → 422.
   c. `getReviewById` → 404 si null.
   d. Transacción:
      - UPDATE `reviews` (idempotente).
      - INSERT en `admin_audit_log` con `event='review_hidden'`.
   e. Devolver 200 con la fila actualizada.
3. Cliente recibe 200; el siguiente GET público (HU-07.4) ya no muestra la reseña (cache TTL 60s).

## Capa de servicios

- `src/lib/services/reviews.ts` (extender):
  - `hideReviewAsAdmin(env, reviewId, adminId, reason): Promise<Review>` — orquesta transacción.
  - `recordAdminAudit(env, adminId, event, targetKind, targetId, reason): Promise<void>` — INSERT en audit log.
- `src/lib/services/admin/audit.ts` (helper compartido con REQ-13):
  - Reutilizable para otros eventos (`review_restored`, `provider_verified`, etc.).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/admin.test.ts` | `reviewHideSchema`: reason 1..200 OK; vacío falla; 201 chars falla |
| Unit | `tests/unit/services/reviews.test.ts` (extender) | `hideReviewAsAdmin` con review no oculta → status='hidden'; con review ya oculta → status se mantiene, audit se inserta igual |
| Integración | `tests/integration/admin/reviews-hide.test.ts` | PATCH admin → 200 + audit log; motivo vacío → 422; vecino → 403; sin sesión → 401; reseña inexistente → 404; reseñas ocultas no aparecen en GET público (HU-07.4); promedio recalculado (HU-09.5) |

## Dependencias y secuencia

- **Bloqueado por:** HU-09.1 (schema), REQ-13 (tabla `admin_audit_log`; si REQ-13 no está listo, este PR la crea como mínimo viable con la fila de `review_hidden`).
- **Bloquea a:** ninguna directa.
- **Recursos compartidos:** `requireAdmin` (helper de REQ-13).

## Riesgos tecnicos

- Riesgo: la transacción falla a mitad (D1 sin BEGIN real) → Mitigación: D1 soporta `db.transaction(...)` vía Drizzle; verificar con test.
- Riesgo: el admin no existe en `users` (sesión huérfana) → Mitigación: el chequeo `role === 'admin'` requiere sesión válida; el FK en `admin_audit_log.actor_id` se valida en DB.
- Riesgo: la FK de audit log a `users` falla porque el admin fue borrado → Mitigación: el caso es teórico; si pasa, devolver 500 con error claro.
- Riesgo: el cache edge sirve la versión vieja hasta 60s → Mitigación: documentar; el admin debe saber que el efecto público tarda. Mejora futura: `cache.purge` explícito.
