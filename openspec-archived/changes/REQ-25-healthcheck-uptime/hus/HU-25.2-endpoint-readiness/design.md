# Diseño técnico — HU-25.2 — Endpoint /ready para deploys

**REQ padre:** REQ-25-healthcheck-uptime

## Modelo de datos

No introduce tablas. Lee `drizzle_migrations` (tabla de bookkeeping de Drizzle Kit).

## Contrato de API

| Endpoint | Método | Auth | Response 200 | Response 503 | Cache |
|---|---|---|---|---|---|
| `/api/v1/ready` | GET | público | `{ ready: true, version: string, migrations_current: true }` | `{ ready: false, reason: 'warmup' \| 'migrations_pending', version?: string }` | `Cache-Control: no-store` |

## Validaciones Zod

```ts
// src/lib/validators/health/ready.ts
export const readyResponseSchema = z.union([
  z.object({
    ready: z.literal(true),
    version: z.string(),
    migrations_current: z.literal(true),
  }),
  z.object({
    ready: z.literal(false),
    reason: z.enum(['warmup', 'migrations_pending']),
    version: z.string().optional(),
  }),
])
```

## Componentes UI

No aplica. Backend puro.

## Flujo de interacción (secuencial)

1. Pipeline de deploy (REQ-26) hace polling a `GET /api/v1/ready` tras deploy.
2. Handler consulta `isReadyFlag` (variable de módulo) — si false → 503 `reason: warmup`.
3. Handler consulta `checkMigrationsCurrent(env)`:
   - Lee `drizzle_migrations` ordenado desc por `created_at` → `lastApplied = rows[0].hash`.
   - Compara con `MIGRATION_ARTIFACT_HASH` (constante inyectada en build time vía `import.meta.env`).
   - Si difieren → 503 `reason: migrations_pending`.
4. Si todo OK → 200 con `version: BUILD_SHA`, `migrations_current: true`.

## Capa de servicios

- `src/lib/services/health/migrations.ts`:
  - `checkMigrationsCurrent(env): Promise<{ current: boolean, lastApplied: string | null, expected: string }>` — query a `drizzle_migrations` con cache KV 30s.
- `src/lib/services/health/ready.ts`:
  - `runReadinessCheck(env): Promise<ReadyResponse>` — orquesta flag + migraciones.

### Constante de build
- `MIGRATION_ARTIFACT_HASH`: calculada en build time con `bun run scripts/compute-migration-hash.ts` y exportada como constante. Inyectada en el bundle.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/ready.test.ts` — `runReadinessCheck` con flag false → 503 warmup; con flag true + hash coincidente → 200; con flag true + hash distinto → 503 migrations_pending. |
| Integración | `tests/integration/health/ready.test.ts` — fixture con `drizzle_migrations` vacía + artifact hash "abc" → 200 migrations_current:true (Drizzle Kit trata tabla vacía como "todo aplicado"); con `drizzle_migrations` última fila hash "xyz" + artifact "abc" → 503 migrations_pending; D1 con probe degradado pero migraciones OK → 200 (a diferencia de /health). |
| E2E | `tests/e2e/health-ready.spec.ts` — pipeline simulado: deploy → polling cada 1s → tras 3s ve 200. |

## Dependencias y secuencia

- **Bloqueado por:** HU-25.1 (separación conceptual health vs ready).
- **Bloquea a:** REQ-26 (CI/CD usa /ready para switch).
- **Recursos compartidos:** `src/lib/services/health/`, tabla `drizzle_migrations`.

## Riesgos técnicos

- Riesgo: la cache KV de `checkMigrationsCurrent` puede servir resultado stale tras deploy → Mitigación: TTL 30s es aceptable; el pipeline puede esperar 30s adicionales antes del switch.
- Riesgo: `import.meta.env.BUILD_SHA` no disponible en runtime Workers → Mitigación: usar `process.env` o un archivo `worker-configuration.d.ts` con tipos; documentar.
- Riesgo: tabla `drizzle_migrations` no existe en DB → Mitigación: `checkMigrationsCurrent` retorna `{current: true, lastApplied: null, expected}` y trata null como "no hay migraciones previas, asumimos estado actual".