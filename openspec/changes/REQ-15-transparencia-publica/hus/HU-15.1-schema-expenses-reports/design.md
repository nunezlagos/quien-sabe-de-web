# Diseño técnico — HU-15.1 — Schema expenses + monthly_reports

**REQ padre:** REQ-15-transparencia-publica

## Modelo de datos

### Tablas Drizzle (pseudocódigo)

```ts
// src/database/schema.ts (extracto)
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),                        // ULID
  provider: text('provider').notNull(),               // "Cloudflare", "NIC.cl"
  concept: text('concept').notNull(),                 // "Renovación Dominio .CL"
  amountClp: integer('amount_clp').notNull(),         // CHECK > 0
  paidAt: text('paid_at').notNull(),                  // ISO date YYYY-MM-DD
  documentR2Key: text('document_r2_key'),             // nullable
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  createdBy: text('created_by').notNull(),            // FK users.id (admin)
})

export const monthlyReports = sqliteTable('monthly_reports', {
  yyyyMm: text('yyyy_mm').primaryKey(),               // "2026-05"
  donationsTotal: integer('donations_total').notNull(),
  expensesTotal: integer('expenses_total').notNull(),
  ratio: real('ratio').notNull(),                     // expenses_total / donations_total
  pdfR2Key: text('pdf_r2_key').notNull(),
  generatedAt: integer('generated_at', { mode: 'timestamp_ms' }).notNull(),
})
```

### Migración Drizzle

- Archivo objetivo: `src/database/migrations/00XX_finance.sql`
- Cambios:
  - `CREATE TABLE expenses (...)` con `CHECK (amount_clp > 0)` y FK `created_by REFERENCES users(id)`.
  - `CREATE INDEX idx_expenses_paid_at ON expenses(paid_at)` para queries por rango.
  - `CREATE INDEX idx_expenses_document ON expenses(document_r2_key) WHERE document_r2_key IS NOT NULL`.
  - `CREATE TABLE monthly_reports (...)` con PK natural `yyyy_mm` y CHECK `donations_total >= 0` y `expenses_total >= 0`.

## Contrato de API

No expone endpoints. Esta HU es exclusivamente de schema; los endpoints de lectura/escritura están en HU-15.2 (CRUD admin) y HU-15.3 (lectura pública).

## Validaciones Zod

```ts
// src/lib/validators/expenses.ts (pseudocódigo) — base reutilizada por HU-15.2
export const expenseRowSchema = z.object({
  provider: z.string().min(1).max(120),
  concept: z.string().min(1).max(200),
  amount_clp: z.number().int().positive(),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(500).optional(),
})

export const yyyyMmSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)
```

## Componentes UI

No aplica. HU 100% de datos.

## Flujo de interacción (secuencial)

No aplica (sin UI). Flujo de aplicación de la migración:

1. Desarrollador modifica `src/database/schema.ts` con las dos tablas.
2. Ejecuta `docker exec quien-sabe-app bun run db:generate` → Drizzle emite `00XX_finance.sql`.
3. Ejecuta `docker exec quien-sabe-app bun run db:migrate:local` → tablas creadas en D1 local.
4. Test de integración confirma existencia de tablas y CHECK constraint.

## Capa de servicios

- No requiere servicios en esta HU. Tipos derivados (`Expense`, `MonthlyReport`) quedan auto-exportados desde `src/database/schema.ts` para uso de HUs siguientes.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Integración | `tests/integration/finance/schema.test.ts` | Migración aplica, CHECK `amount_clp > 0` rechaza 0 y negativos, PK natural `yyyy_mm` impide duplicados |
| Integración | `tests/integration/finance/schema.test.ts` | Índices `idx_expenses_paid_at` y `idx_expenses_document` presentes en `sqlite_master` |

## Dependencias y secuencia

- **Bloqueado por:** REQ-13 (auth admin, para FK `created_by`), REQ-14 (modelo donaciones, para alimentar `donations_total`).
- **Bloquea a:** HU-15.2, HU-15.3, HU-15.4, HU-15.5, HU-15.6.
- **Recursos compartidos:** `src/database/schema.ts`, `src/database/migrations/`.

## Riesgos técnicos

- Riesgo: índice parcial `WHERE document_r2_key IS NOT NULL` no soportado en algún driver D1 → Mitigación: caer a índice simple sobre la columna; el impacto en performance es marginal a la escala esperada.
- Riesgo: precisión `real` para `ratio` introduce drift → Mitigación: recalcular ratio en lectura desde totales enteros, almacenado solo para cache.
