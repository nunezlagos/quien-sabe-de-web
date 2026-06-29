# Diseño técnico — HU-15.3 — Vista pública /transparency con widgets

**REQ padre:** REQ-15-transparencia-publica

## Modelo de datos

Reutiliza `expenses` y `monthly_reports` de HU-15.1, más la tabla `donations` provista por REQ-14. No requiere migración propia.

Vistas/queries derivadas (agregación SQL en runtime, cacheada en KV):

- `donationsThisMonth` = `SUM(donations.amount_clp) WHERE month(created_at) = current_month`
- `expensesFixedYtd` = `SUM(expenses.amount_clp) WHERE paid_at >= year_start`
- `reserveFund` = `donationsYtd - expensesYtd` (alias "Fondo Reserva")
- `monthlyBreakdown` = `SELECT yyyy_mm, donations_total, expenses_total, ratio FROM monthly_reports ORDER BY yyyy_mm DESC LIMIT 12`

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/public/transparency/summary` | GET | público | — | `{ ingresosMes, gastosFijos, fondoReserva, ratio, ultimaActualizacion, gastos: ExpenseRowPublic[] }` con headers `Cache-Control: public, max-age=300, stale-while-revalidate=600` | 500 |
| `/api/v1/public/transparency/monthly/:yyyy-mm` | GET | público | (definido pero materializado en HU-15.4) | `{ yyyy_mm, donations_total, expenses_total, ratio, pdf_url }` | 404 si no existe |

`ExpenseRowPublic` (sin PII): `{ id, paid_at, concept, amount_clp, has_document: boolean }`. El `document_r2_key` jamás se expone al cliente; en su lugar el frontend pide la URL firmada vía HU-15.6.

## Validaciones Zod

```ts
// src/lib/validators/transparency.ts (pseudocódigo)
export const summaryResponseSchema = z.object({
  ingresosMes: z.number().int().nonnegative(),
  gastosFijos: z.number().int().nonnegative(),
  fondoReserva: z.number().int(),
  ratio: z.number().min(0),
  ultimaActualizacion: z.string(),         // ISO timestamp
  gastos: z.array(z.object({
    id: z.string(),
    paid_at: z.string(),
    concept: z.string(),
    amount_clp: z.number().int().positive(),
    has_document: z.boolean(),
  })),
})
```

## Componentes UI

### Páginas Astro

- `src/pages/transparency.astro` — proposito: vista pública SSR. Layout base: `src/layouts/PublicLayout.astro` (asumido de REQ-13).
  - Mockup base: `mockups/transparency.html:28-130` (página completa).
  - Server-side: fetch a `/api/v1/public/transparency/summary` (interno via `Astro.locals`), inyecta datos a componentes.

### Componentes Astro reutilizables

- `src/components/transparency/Header.astro` — props: ninguna.
  - Mockup base: `mockups/transparency.html:40-44`.
  - Islas: no.
- `src/components/transparency/SummaryCards.astro` — props: `ingresosMes`, `gastosFijos`, `fondoReserva` (números formateados CLP).
  - Mockup base: `mockups/transparency.html:46-59` (grid `md:grid-cols-3` con 3 cards de colores verde/rojo/azul).
  - Islas: no.
- `src/components/transparency/ExpensesTable.astro` — props: `items: ExpenseRowPublic[]`, `ultimaActualizacion: string`.
  - Mockup base: `mockups/transparency.html:61-98` (card con header gris + tabla 4 columnas).
  - Islas: opcional — paginación "ver más" si se decide cargar lotes adicionales por cursor.
- `src/components/transparency/ExpenseRow.astro` — props: `item: ExpenseRowPublic`.
  - Mockup base: `mockups/transparency.html:77-94` (filas con `hover:bg-gray-50` y enlace "Ver Boleta" en azul cuando hay documento, o "Donación directa" gris si no).
  - Islas: sí si HU-15.6 está habilitada — click en "Ver Boleta" pide presigned URL on-demand.
- `src/components/shared/PublicFooter.astro` — props: ninguna.
  - Mockup base: `mockups/transparency.html:102-130` (footer con imagen blur + enlaces).
  - Islas: no.

## Flujo de interacción (secuencial)

1. Visitante anónimo abre `/transparency` (sin cookies de sesión).
2. Astro server-side llama internamente al handler `/api/v1/public/transparency/summary`.
3. Handler consulta KV con key `transparency:summary:v1`:
   - HIT → devuelve JSON cacheado, marca `stale` si pasó TTL.
   - MISS → calcula agregados desde D1 (queries Drizzle) y guarda en KV con TTL 300 s.
4. Astro inyecta el JSON en `SummaryCards` y `ExpensesTable` y renderiza HTML.
5. Browser recibe HTML completo + headers `Cache-Control: public, max-age=300, swr=600`.
6. Si el visitante hace click en "Ver Boleta" de una fila con `has_document=true`, isla pide presigned URL (HU-15.6) y abre en nueva pestaña.

## Capa de servicios

- `src/lib/services/transparency.ts` — métodos:
  - `getSummary(db, kv): Promise<SummaryResponse>` — orquesta cache KV + cálculo D1.
  - `computeSummary(db): Promise<SummaryResponse>` — sin cache; agregaciones Drizzle puras (usado por tests).
  - `invalidateSummaryCache(kv): Promise<void>` — borra key KV; invocado desde HU-15.2.
  - `formatClp(amount: number): string` — helper "$45.000" (mockup `mockups/transparency.html:49`).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/transparency.test.ts` | `computeSummary` con fixtures; `formatClp` casos límite (0, millones, negativos) |
| Unit | `tests/unit/services/transparency.test.ts` | `invalidateSummaryCache` llama `kv.delete` con key esperada |
| Integración | `tests/integration/transparency/summary.test.ts` | `GET /api/v1/public/transparency/summary` retorna headers cache correctos, payload sin email/nombre |
| Integración | `tests/integration/transparency/summary.test.ts` | KV hit/miss/SWR: segunda llamada en <100ms con MISS previo |
| E2E | `tests/e2e/transparency-view.spec.ts` | Visitante anónimo carga `/transparency`, ve 3 tarjetas con números, ve tabla con al menos una fila, no hay header `Set-Cookie` |

## Dependencias y secuencia

- **Bloqueado por:** HU-15.1 (schema), HU-15.2 (datos), REQ-14 (donaciones).
- **Bloquea a:** HU-15.6 (link "Ver Boleta" depende de esta tabla renderizada).
- **Recursos compartidos:** binding KV (`Astro.locals.runtime.env.SESSION` o un namespace dedicado `TRANSPARENCY_CACHE`), `src/pages/api/v1/public/transparency/`.

## Riesgos técnicos

- Riesgo: KV eventual consistency entre regiones puede mostrar dato stale tras una invalidación → Mitigación: SWR aceptado por contrato; la tabla se considera correcta dentro de ±5 min.
- Riesgo: queries de agregación lentas a medida que `expenses` crece → Mitigación: índice por `paid_at` (HU-15.1) y limitar tabla a 50 filas más recientes; histórico vía PDF mensual.
- Riesgo: bot scraping del endpoint → Mitigación: el contenido es público por diseño; aceptable. Rate limit razonable a nivel Worker.
