# Diseño técnico — HU-12.6 — Banner de estado de verificación

**REQ padre:** REQ-12-dashboard-prestador

## Modelo de datos

Lectura sobre la tabla `verifications` (existente o introducida por REQ de verificación). Si no existe aún en el esquema, esta HU exige su presencia con esta forma mínima:

```ts
// src/database/schema.ts (extracto referencial)
export const verifications = sqliteTable('verifications', {
  // id, provider_id, status: 'not_requested' | 'pendiente' | 'verificado' | 'rechazado',
  // rejection_reason: text | null, submitted_at, reviewed_at
})
```

### Migración Drizzle

- Si la tabla `verifications` no existe: archivo objetivo `src/database/migrations/NNNN_verifications.sql`.
- Cambios: crear tabla con índice en `provider_id` y default `status = 'not_requested'`.

(Si la tabla ya existe, esta HU no genera migración.)

## Contrato de API

Esta HU no requiere endpoint dedicado en la Opción A (lectura SSR). Se documenta uno opcional para futura iteración:

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| (opcional futuro) `/api/v1/providers/me/verification` | GET | sesión prestador | (ninguno) | `{ status, rejection_reason? }` | 401, 403 |

## Validaciones Zod

```ts
// src/lib/validators/verification.ts (pseudocódigo)
export const verificationStatusSchema = z.enum(['not_requested', 'pendiente', 'verificado', 'rechazado'])
```

## Componentes UI

### Páginas Astro

- Sin página nueva. Se monta como bloque dentro de `src/pages/dashboard-provider.astro` (HU-12.1) entre el header del panel principal (`mockups/dashboard-provider.html:71-75`) y los widgets (`mockups/dashboard-provider.html:78-95`).

### Componentes Astro reutilizables

- `src/components/dashboard/provider/VerificationBanner.astro` — props: `status: 'not_requested' | 'pendiente' | 'verificado' | 'rechazado'`, `rejectionReason?: string`.
  - Renderiza condicionalmente:
    - `verificado`: retorna `null` (no se muestra).
    - `pendiente`: banner amarillo con icono `ri-time-line`.
    - `rechazado`: banner rojo con icono `ri-error-warning-line`, motivo y botón "Reenviar" → `<a href="/verification">`.
    - `not_requested`: banner azul con CTA "Verifica tu oficio" → `<a href="/verification">`.
  - Mockup base: `mockups/verification.html:42-48` (patrón visual). UI a diseñar siguiendo este estilo.
  - Islas requeridas: no (HTML estático generado en SSR).

## Flujo de interacción (secuencial)

1. SSR de `dashboard-provider.astro` resuelve `getVerificationStatus(env, userId)` antes de renderizar.
2. Se monta `VerificationBanner` con el estado.
3. Si `status === 'rechazado'` y el usuario hace click en "Reenviar", el browser navega a `/verification` (REQ de verificación).
4. Tras reenviar evidencias y volver al dashboard, el SSR refleja el nuevo estado `pendiente`.

## Capa de servicios

- `src/lib/services/verification.service.ts`:
  - `getVerificationStatus(env, userId): Promise<{ status, rejectionReason: string | null }>` — lee la última fila de `verifications` para el `provider_id` del usuario.
  - Si no hay fila, retorna `{ status: 'not_requested', rejectionReason: null }`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/verification-status.test.ts` | `getVerificationStatus` mapea correctamente filas existentes y ausencia (`not_requested`). |
| Integración | `tests/integration/dashboard/verification-banner.test.ts` | Render del dashboard expone el banner adecuado según fila de `verifications`. |
| E2E | `tests/e2e/provider-verification-banner.spec.ts` | Estados `pendiente`, `rechazado` (con CTA reenviar → `/verification`), `verificado` (sin banner). |

## Dependencias y secuencia

- **Bloqueado por:** HU-12.1, REQ de verificación (tabla `verifications` y vista `/verification`).
- **Bloquea a:** —.
- **Recursos compartidos:** binding `DB`, ruta `/verification`.

## Riesgos técnicos

- Riesgo: lectura de `verifications` falla y rompe el dashboard. Mitigación: try/catch en el servicio que devuelve `not_requested` y loggea.
- Riesgo: motivo de rechazo contiene HTML. Mitigación: render como texto plano (Astro escapa por defecto).
- Riesgo: enlace "Reenviar" abre en misma pestaña y pierde scroll. Mitigación: aceptable porque es flujo de verificación, no edición.
