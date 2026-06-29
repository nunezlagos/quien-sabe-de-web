# Diseño técnico — HU-21.3 — Endpoint crear perfil PRO desde wizard

**REQ padre:** REQ-21-onboarding-prestador

## Modelo de datos

Reutiliza `providers` (REQ-04) y `provider_communes` (HU-21.2). Esta HU no introduce tablas nuevas.

### Tabla `providers` (extracto usado)

```ts
// src/database/schema.ts (extracto REQ-04 + esta HU)
export const providers = sqliteTable('providers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  whatsapp: text('whatsapp').notNull(),         // E.164 normalizado "+569XXXXXXXX"
  bio: text('bio'),
  basePriceClp: integer('base_price_clp').notNull(),
  status: text('status', { enum: ['pending_verification', 'approved', 'rejected', 'deleted'] })
    .notNull().default('pending_verification'),
  // ... resto columnas REQ-04
})
```

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 201 | Errores |
|---|---|---|---|---|---|
| `/api/v1/providers/me` | POST | sesión + email verificado | `ProviderCreatePayload` (ver Zod) | `{ id, status: "pending_verification" }` | 400 (body inválido), 401 (sin sesión), 403 (email no verificado o ya tiene provider), 422 (bio > 500, whatsapp formato inválido) |

Request body:
```json
{
  "display_name": "Juan P.",
  "trade_id": 1,
  "trade_pending_approval": null,
  "bio": "Gasfiter con 15 años...",
  "whatsapp": "912345678",
  "base_price_clp": 15000,
  "commune_ids": [1, 2, 3]
}
```

## Validaciones Zod

```ts
// src/lib/validators/providers.ts
export const providerCreateSchema = z.object({
  display_name: z.string().min(2).max(80),
  trade_id: z.number().int().positive().nullable(),
  trade_pending_approval: z.string().min(2).max(60).nullable(),
  bio: z.string().max(500).optional().default(''),
  whatsapp: z.string().min(8).max(20),  // formato libre, se normaliza
  base_price_clp: z.number().int().positive().max(10_000_000),
  commune_ids: z.array(z.number().int().positive()).min(1).max(14),
}).refine(
  (data) => data.trade_id !== null || (data.trade_pending_approval && data.trade_pending_approval.length >= 2),
  { message: "Debe elegir un oficio del catálogo o especificar uno nuevo" }
)
```

```ts
// src/lib/utils/phone.ts (pseudocódigo)
export function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, '')           // "56912345678"
  if (digits.length === 9 && digits.startsWith('9')) return '+56' + digits
  if (digits.length === 11 && digits.startsWith('569')) return '+' + digits
  if (digits.length === 8) return '+569' + digits // 12345678 sin prefijo
  throw new Error('Formato WhatsApp inválido')
}
```

## Componentes UI

No aplica. Esta HU es backend puro. El cliente que dispara el POST es responsabilidad de HU-21.4.

## Flujo de interacción (secuencial)

1. Cliente (HU-21.4) envía `POST /api/v1/providers/me` con payload del wizard.
2. Middleware `requireVerifiedEmail` valida sesión + email verificado (REQ-20). Si falla → 401/403.
3. Middleware `requireNoExistingProvider` consulta `SELECT id FROM providers WHERE user_id = ?`. Si existe → 403 "ya tienes un perfil activo".
4. Handler parsea body con `providerCreateSchema`. Si falla → 422 con detalle por campo.
5. Helper `normalizeWhatsapp(raw)` → formato canónico `+569XXXXXXXX`. Si lanza → 422.
6. `db.batch([insertProviders, ...insertProviderCommunes])` en una transacción.
7. Si `trade_id === null` y `trade_pending_approval` presente, INSERT adicional en `trades` con `status="pending"`.
8. Responde 201 con `{id, status: "pending_verification"}`.

## Capa de servicios

`src/lib/services/providers/create.ts`:
- `createProviderFromWizard(env, userId, payload): Promise<{ id, status }>` — orquesta validación + transacción.
- Internamente llama a `assignCommunesToProvider` (HU-21.2) dentro del batch.

`src/lib/utils/phone.ts`:
- `normalizeWhatsapp(raw: string): string` — exportado para reuso en REQ-01 y tests.

`src/lib/services/trades/pending.ts`:
- `createPendingTrade(env, name: string): Promise<{ id }>` — usado cuando `trade_id === null`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/utils/phone.test.ts` | `normalizeWhatsapp` cubre `912345678` → `+56912345678`, `+56912345678` → `+56912345678`, `56912345678` → `+56912345678`, `12345678` → `+56912345678`, vacío → throw, con letras → throw. |
| Unit | `tests/unit/validators/providers.test.ts` | `providerCreateSchema` rechaza bio > 500, whatsapp < 8 dígitos, commune_ids vacío, sin oficio. |
| Integración | `tests/integration/providers/wizard-create.test.ts` | POST válido → 201 + filas en `providers` y `provider_communes`; transacción rollback si INSERT communes falla; 403 sin email verificado; 403 con provider existente. |
| E2E | `tests/e2e/create-trade-flow.spec.ts` (consumido por HU-21.4) | Login vecino verificado → completa wizard → submit → redirige a `/verification`. |

## Dependencias y secuencia

- **Bloqueado por:** HU-21.1 (form con `name` correctos), HU-21.2 (tabla `provider_communes` + catálogos), REQ-01 (sesión), REQ-04 (tabla `providers`), REQ-20 (email verificado), REQ-02 (catálogo `communes`).
- **Bloquea a:** HU-21.4 (redirect post-201), HU-21.5 (banner en dashboard).
- **Recursos compartidos:** `src/lib/validators/providers.ts`, `src/database/schema.ts`, D1 binding.

## Riesgos técnicos

- Riesgo: D1 batch excede 50 statements con muchos communes → Mitigación: validar `commune_ids.length <= 14` en Zod; documentar el límite.
- Riesgo: validación de WhatsApp con prefijo país hardcodeado a Chile (+56) → Mitigación: este producto es sólo Chile por ahora; documentar en helper.
- Riesgo: 201 vs 200 inconsistente con otros endpoints del REQ → Mitigación: documentar en `docs/api-conventions.md` que operaciones de creación devuelven 201.