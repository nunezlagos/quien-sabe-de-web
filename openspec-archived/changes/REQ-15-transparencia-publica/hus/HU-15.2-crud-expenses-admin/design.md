# Diseño técnico — HU-15.2 — CRUD de gastos admin

**REQ padre:** REQ-15-transparencia-publica

## Modelo de datos

Reutiliza tablas creadas en HU-15.1 (`expenses`, `monthly_reports`). Esta HU no introduce nuevas tablas ni migraciones.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200/201 | Errores |
|---|---|---|---|---|---|
| `/api/v1/admin/expenses` | POST | sesión admin | `{ provider, concept, amount_clp, paid_at, note? }` | `201 { id, ...expense }` | 400 validación Zod, 401 sin sesión, 403 no-admin |
| `/api/v1/admin/expenses` | GET | sesión admin | (query: `?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=50&cursor=`) | `200 { items[], nextCursor }` | 401, 403 |
| `/api/v1/admin/expenses/:id` | GET | sesión admin | — | `200 { expense }` | 401, 403, 404 |
| `/api/v1/admin/expenses/:id` | PATCH | sesión admin | `{ provider?, concept?, amount_clp?, paid_at?, document_r2_key?, note? }` | `200 { expense }` | 400, 401, 403, 404 |
| `/api/v1/admin/expenses/:id` | DELETE | sesión admin | — | `204` (sin body) | 401, 403, 404, 409 si referenciado por reporte congelado y `force!=true` |

## Validaciones Zod

```ts
// src/lib/validators/expenses.ts (pseudocódigo)
export const createExpenseSchema = z.object({
  provider: z.string().min(1).max(120),
  concept: z.string().min(1).max(200),
  amount_clp: z.number().int().positive(),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(500).optional(),
})

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  document_r2_key: z.string().max(512).nullable().optional(),
})

export const expensesQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
})
```

## Componentes UI

### Páginas Astro

- `src/pages/admin/index.astro` (existente, REQ-13) — añadir sección "Finanzas" identificada por `id="finances-section"`.
- Mockup base: `mockups/dashboard-admin.html:268-274`.

### Componentes Astro reutilizables

- `src/components/admin/ExpensesManager.astro` — props: ninguna (lee `Astro.locals.user`).
  - Mockup base: `mockups/dashboard-admin.html:268-274` (placeholder) + patrón tabla genérica del dashboard admin.
  - Islas requeridas: sí — botón "Nuevo Gasto" abre modal, tabla con paginación.
- `src/components/admin/ExpenseFormModal.astro` — props: `mode: 'create' | 'edit'`, `initial?: Expense`.
  - Mockup base: `mockups/dashboard-admin.html:287-342` (estructura de modal `user-modal`).
  - Islas requeridas: sí — submit fetch + cerrar modal.
- `src/components/admin/ExpensesTable.astro` — props: `items: Expense[]`, `nextCursor?: string`.
  - Mockup base: tabla genérica admin (mismo patrón visual que `mockups/transparency.html:66-97` pero con columnas adicionales para acciones).
  - Islas requeridas: sí — botones editar/eliminar disparan modal o confirmación.

## Flujo de interacción (secuencial)

1. Admin navega a `/admin` y hace click en `nav-link` con `data-target="finances-section"` (`mockups/dashboard-admin.html:33`).
2. `ExpensesManager.astro` renderiza tabla con `GET /api/v1/admin/expenses?limit=50` (server-side).
3. Admin pulsa "Nuevo Gasto" → isla abre `ExpenseFormModal` (patrón mockup `mockups/dashboard-admin.html:287`).
4. Admin completa formulario y submite → fetch `POST /api/v1/admin/expenses` con JSON validado por Zod cliente.
5. Servidor: middleware verifica sesión + rol admin → handler valida con `createExpenseSchema` → inserta vía Drizzle → audita en log → responde 201.
6. Isla cierra modal, prependa la fila a la tabla y dispara invalidación del cache KV de transparencia (HU-15.3).
7. Edición/eliminación siguen patrón equivalente con `PATCH`/`DELETE`.

## Capa de servicios

- `src/lib/services/expenses.ts` — métodos:
  - `createExpense(db, input, actorId): Promise<Expense>`
  - `updateExpense(db, id, patch, actorId): Promise<Expense>`
  - `deleteExpense(db, id, actorId): Promise<void>`
  - `listExpenses(db, query): Promise<{ items: Expense[]; nextCursor?: string }>`
  - `getExpense(db, id): Promise<Expense | null>`
- Reusa helpers de auditoría existentes (`src/lib/services/audit.ts` si existiera; si no, log estructurado via `console.info`).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/expenses.test.ts` | Schemas Zod aceptan/rechazan casos límite (amount=0, paid_at mal formado, note >500) |
| Integración | `tests/integration/admin/expenses.test.ts` | 4 escenarios Gherkin del `hu.md`: crear válido, asociar documento via PATCH, eliminar 204, no-admin 403 |
| Integración | `tests/integration/admin/expenses.test.ts` | Paginación con cursor, filtros `from`/`to`, 404 en `:id` inexistente |
| E2E | `tests/e2e/admin-expenses.spec.ts` | Login admin → crear gasto desde modal → ver fila en tabla → editar → eliminar |

## Dependencias y secuencia

- **Bloqueado por:** HU-15.1 (schema), REQ-13 (auth + middleware admin).
- **Bloquea a:** HU-15.3 (necesita datos para mostrar), HU-15.6 (asocia documento via PATCH).
- **Recursos compartidos:** `src/lib/validators/expenses.ts`, `src/components/admin/*`.

## Riesgos técnicos

- Riesgo: race entre cache KV de `/transparency` y mutación admin → Mitigación: invalidación explícita por key `transparency:summary` tras cada POST/PATCH/DELETE.
- Riesgo: actor admin eliminado deja `created_by` huérfano → Mitigación: FK ON DELETE SET NULL en migración HU-15.1.
- Riesgo: cliente envía `document_r2_key` arbitrario en PATCH apuntando a otro bucket → Mitigación: validar prefijo `expenses/` en el schema Zod y rechazar otros prefijos.
