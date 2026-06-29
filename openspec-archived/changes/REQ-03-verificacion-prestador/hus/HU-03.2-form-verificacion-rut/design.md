# Diseno tecnico — HU-03.2 — Formulario de verificación de prestador

**REQ padre:** REQ-03-verificacion-prestador

## Modelo de datos

### Tabla Drizzle

```ts
// src/database/schema.ts (extracto)
export const providerVerifications = sqliteTable('provider_verifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rut: text('rut').notNull(),  // formato normalizado: 12345678-5
  status: text('status', { enum: ['pendiente', 'verificado', 'rechazado'] }).notNull().default('pendiente'),
  rejectionReason: text('rejection_reason'),
  reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  byUser: index('idx_provider_verifications_user').on(t.userId),
  byStatus: index('idx_provider_verifications_status').on(t.status),
  // Índice único parcial para evitar dos pendientes por mismo user (defensa adicional al check en servicio)
}))
```

### Migracion Drizzle

- Archivo: `src/database/migrations/0006_provider_verifications.sql`.
- Cambios:
  - `CREATE TABLE provider_verifications (...)` con `CHECK (status IN ('pendiente','verificado','rechazado'))`.
  - `CREATE INDEX idx_provider_verifications_user ON provider_verifications(user_id);`
  - `CREATE INDEX idx_provider_verifications_status ON provider_verifications(status);`
  - `CREATE UNIQUE INDEX idx_provider_verifications_one_pending ON provider_verifications(user_id) WHERE status = 'pendiente';` (SQLite soporta índices parciales desde 3.8).

## Contrato de API

### `POST /api/v1/providers/me/verification` [sesión prestador]

Request:
```json
{ "rut": "12.345.678-5" }
```

Response 201:
```json
{ "id": 42, "rut": "12.345.678-5", "status": "pendiente", "created_at": 1716000000 }
```

Errores: 422 (RUT inválido), 409 (ya existe pendiente), 403 (usuario no es prestador).

### `GET /api/v1/providers/me/verification` [sesión prestador]

Devuelve la solicitud más reciente (o la activa si hay pendiente). Response 200:
```json
{
  "status": "pendiente",
  "rut_masked": "12.***.*5",
  "created_at": 1716000000,
  "reviewed_at": null,
  "rejection_reason": null
}
```

Si nunca hubo solicitud → 404.

## Validaciones Zod

```ts
// src/lib/validators/verification.ts
import { rutSchema } from './rut'

export const CreateVerificationBody = z.object({
  rut: rutSchema,
})

export const VerificationPublicView = z.object({
  status: z.enum(['pendiente', 'verificado', 'rechazado']),
  rut_masked: z.string(),
  created_at: z.number().int(),
  reviewed_at: z.number().int().nullable(),
  rejection_reason: z.string().nullable(),
})
```

## Componentes UI

- Vista `src/pages/verification.astro` — replica estructura de `mockups/verification.html:77-128` (card con form, RUT input, oficio select, declaración checkbox).
- Componente `src/components/verification/Form.astro` — form HTML con `data-validate-rut="true"` (atributo para que el JS del cliente use el helper de HU-03.1).
- Helper `maskRut(rut)` para mostrar `12.***.*5` (privacidad).

## Flujo de interaccion (secuencial)

1. Prestador navega a `/verification`.
2. Si ya tiene verificación → muestra estado actual (pending: spinner; rejected: muestra `rejection_reason` y form para reenviar; verified: muestra badge verde).
3. Si no tiene → form vacío.
4. Submit POST → backend valida Zod → check pendiente existente → insert → 201.
5. Frontend muestra confirmación + redirige a `/dashboard-provider` tras 2s.

## Capa de servicios

```ts
// src/lib/services/verification/index.ts
export async function createVerification(db, userId: number, rut: string): Promise<ProviderVerification>
export async function getCurrentVerification(db, userId: number): Promise<ProviderVerificationView | null>
export async function maskRut(rut: string): string  // "12.345.678-5" → "12.***.*5"
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/verification/mask-rut.test.ts` | `maskRut("12345678-5")` → `"12.***.*5"`; `maskRut("9876543-K")` → `"9.***.*K"` |
| Integracion | `tests/integration/verification/form.test.ts` | POST con RUT válido y sin pendiente → 201; con pendiente existente → 409; con RUT inválido → 422; GET devuelve estado correcto con `rut_masked` |
| E2E | `tests/e2e/verification-submit.spec.ts` | prestador navega a `/verification` → completa RUT → ve confirmación → admin lo ve en cola (HU-03.4 cuando exista) |

## Dependencias y secuencia

- **Bloqueado por:** HU-01.1 (tabla `users`), HU-03.1 (`rutSchema`).
- **Bloquea a:** HU-03.3 (upload de documentos presupone verificación pendiente), HU-03.4 (cola admin lee `provider_verifications`), HU-03.5 (transiciones sobre esta tabla).
- **Recursos compartidos:** tabla `provider_verifications`, `rutSchema` de HU-03.1.

## Riesgos tecnicos

- Riesgo: índice único parcial no soportado en D1 → Mitigación: validar primero con `SELECT WHERE status='pendiente' AND user_id = ?` y capturar error de UNIQUE si la validación pasa por race; fallback con lock pesimista no es viable en D1 → documentar la limitación y aceptar el race window mínimo.
- Riesgo: el RUT se guarda en claro en DB → Mitigación: aceptable para MVP; el endpoint público lo enmascara. Cifrado at-rest en D1 es responsabilidad del binding.
- Riesgo: GET sin filtro expone `rut` si el cliente envía `Accept: application/json` con header raro → Mitigación: el handler siempre devuelve el shape `VerificationPublicView` con `rut_masked`; nunca el `rut` crudo.
