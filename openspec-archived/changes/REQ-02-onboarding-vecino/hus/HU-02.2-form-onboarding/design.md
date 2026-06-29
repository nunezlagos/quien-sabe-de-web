# Diseno tecnico — HU-02.2 — Wizard de onboarding con Zod

**REQ padre:** REQ-02-onboarding-vecino

## Modelo de datos

### Extensión de `users` (HU-02.1 ya creó la tabla base; HU-01.1 la tiene con `id, email, password_hash, role, status, createdAt`)

```ts
// src/database/schema.ts (extracto adicional)
export const usersOnboardingExtension = {
  communeId: integer('commune_id').references(() => communes.id, { onDelete: 'set null' }),
  onboardedAt: integer('onboarded_at', { mode: 'timestamp' }),
  acceptedTermsAt: integer('accepted_terms_at', { mode: 'timestamp' }),
  acceptedPrivacyAt: integer('accepted_privacy_at', { mode: 'timestamp' }),
  termsVersion: text('terms_version'),  // p.ej. 'v1'
  privacyVersion: text('privacy_version'),
}
```

### Migracion Drizzle

- Archivo: `src/database/migrations/0004_onboarding_fields.sql` (aditivo a las tablas existentes de HU-01.1 y HU-02.1).
- Cambios:
  - `ALTER TABLE users ADD COLUMN commune_id INTEGER REFERENCES communes(id) ON DELETE SET NULL;`
  - `ALTER TABLE users ADD COLUMN onboarded_at INTEGER;`
  - `ALTER TABLE users ADD COLUMN accepted_terms_at INTEGER;`
  - `ALTER TABLE users ADD COLUMN accepted_privacy_at INTEGER;`
  - `ALTER TABLE users ADD COLUMN terms_version TEXT;`
  - `ALTER TABLE users ADD COLUMN privacy_version TEXT;`
  - `CREATE INDEX idx_users_commune ON users(commune_id);`

## Contrato de API

### `GET /api/v1/users/me/profile` [sesión]

Response 200:
```json
{
  "commune_id": 13114,
  "onboarded": true,
  "onboarded_at": 1716000000,
  "accepted_terms_at": 1716000000,
  "terms_version": "v1",
  "accepted_privacy_at": 1716000000,
  "privacy_version": "v1"
}
```

### `POST /api/v1/users/me/profile` [sesión vecino]

Request:
```json
{
  "commune_id": 13114,
  "accepted_terms": true,
  "accepted_privacy": true,
  "terms_version": "v1",
  "privacy_version": "v1"
}
```
Response 200: mismo shape que GET.

Errores: 400 `debe aceptar términos`, 422 `comuna inválida`, 422 `versión de términos desactualizada`.

### `PATCH /api/v1/users/me/profile` [sesión vecino]

Acepta subconjunto (ej. sólo `commune_id`). No cambia `onboarded_at` si ya estaba; actualiza si es el primer POST. Zod partial del body.

## Validaciones Zod

```ts
// src/lib/validators/onboarding.ts
const CURRENT_TERMS_VERSION = 'v1'  // constante exportada
const CURRENT_PRIVACY_VERSION = 'v1'

export const OnboardingBody = z.object({
  commune_id: z.number().int().positive(),
  accepted_terms: z.literal(true),
  accepted_privacy: z.literal(true),
  terms_version: z.literal(CURRENT_TERMS_VERSION),
  privacy_version: z.literal(CURRENT_PRIVACY_VERSION),
}).refine(
  async (data) => await communeExists(data.commune_id),
  { message: 'comuna inválida', path: ['commune_id'] }
)

export const OnboardingPatch = OnboardingBody.partial()
```

## Componentes UI

- Vista `src/pages/onboarding.astro` — contenedor del wizard.
- Componente `src/components/onboarding/Wizard.astro` — 3 pasos (commune, preferences, consents).
- Cliente acumula estado en island JS, llama `POST /api/v1/users/me/profile` al confirmar.

## Flujo de interaccion (secuencial)

1. Usuario registrado aterriza en `/onboarding` (redirect por HU-02.4).
2. Step 1 comuna: select con `GET /api/v1/communes` (HU-02.1).
3. Step 2 preferencias: checkboxes de intereses + notify_email (HU-02.3 los persiste).
4. Step 3 consentimientos: 2 checkboxes de aceptación + links a `/terms` y `/privacy`.
5. Click "Continuar" → cliente hace `POST /api/v1/users/me/profile`.
6. Backend valida Zod (commune existe, terms_version vigente, accepted===true), upsert en `users`, retorna 200.
7. Cliente redirige a `/dashboard-user`.

## Capa de servicios

```ts
// src/lib/services/onboarding.ts
export async function completeOnboarding(db, userId: number, input: OnboardingBody): Promise<User>
export async function patchOnboarding(db, userId: number, input: OnboardingPatch): Promise<User>
export async function getOnboardingState(db, userId: number): Promise<OnboardingState>
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/onboarding.test.ts` | `OnboardingBody` rechaza `accepted_terms: false`, `terms_version: 'v0'`, refine falla con commune_id inexistente |
| Unit | `tests/unit/onboarding/state.test.ts` | `completeOnboarding` setea `onboarded_at` la primera vez; segundo POST no lo cambia |
| Integracion | `tests/integration/onboarding/post.test.ts` | POST válido 200 + fila actualizada; sin `accepted_terms: true` → 400; `commune_id` inexistente → 422 |
| Integracion | `tests/integration/onboarding/patch.test.ts` | PATCH parcial actualiza `commune_id` sin tocar `onboarded_at` |
| E2E | `tests/e2e/onboarding-flow.spec.ts` | registro → /onboarding → completar 3 pasos → /dashboard-user |

## Dependencias y secuencia

- **Bloqueado por:** HU-01.1 (tabla `users`), HU-02.1 (catálogo `communes`).
- **Bloquea a:** HU-02.4 (redirect basado en `onboarded`), HU-11 (dashboard-user).
- **Recursos compartidos:** tabla `users`, tabla `communes`, `src/lib/utils/terms.ts` (constantes de versión).

## Riesgos tecnicos

- Riesgo: `ALTER TABLE` en D1 no soporta todas las variantes → Mitigación: la migración usa `ALTER TABLE ... ADD COLUMN` que sí soporta; FK se agrega separada.
- Riesgo: cliente envía `terms_version` viejo cacheado → Mitigación: Zod `z.literal(CURRENT_TERMS_VERSION)` rechaza; cliente debe fetchear la versión actual en load (futuro: endpoint `/terms/current`).
- Riesgo: la refinement async de Zod requiere el adapter → Mitigación: usar `z.ZodType` con `.parseAsync` o ejecutar la validación de commune fuera del schema (helper `assertCommuneExists`).
