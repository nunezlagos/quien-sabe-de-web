# HU-04.2 — CRUD del perfil de prestador con Zod

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-04-perfil-prestador
**Rama:** `feat/HU-04.2-crud-perfil-prestador`

## Tareas tecnicas

- [ ] **T1** Definir `providerCreateSchema`, `providerPatchSchema` en `src/lib/validators/providers.ts` (con regex de teléfono, rango de `hourly_rate_clp`).
- [ ] **T2** Helper `sanitizeDescription(html)` en `src/lib/services/providers.ts` usando `DOMPurify` con whitelist conservadora (`b`, `i`, `br`, `ul`, `li`, `p`).
- [ ] **T3** Servicio `providers.ts` con `getProviderByUser`, `createProvider`, `updateProvider`, `softDeleteProvider` — todas devuelven `Provider | null` o void según corresponda.
- [ ] **T4** Helper `generateProviderSlug(name, commune, suffix?)` integrado en `createProvider` (delega al helper de HU-04.1).
- [ ] **T5** Endpoint `src/pages/api/v1/providers/me/index.ts` con ruteo por método HTTP (GET/POST/PATCH/DELETE). Cada handler: validar sesión, validar body con Zod, sanitizar `description`, persistir vía servicio, mapear a status HTTP correcto.
- [ ] **T6** Hook de reindex: en `updateProvider`, si `tradeId` o `communeId` cambió → setear `needsReindex: true` en el retorno. HU-04.5 lo conecta al indexer real.
- [ ] **T7** Tests:
  - [ ] `tests/unit/validators/providers.test.ts` — Zod rechaza datos inválidos, acepta boundary (rate 0, rate 10M, phone +56912345678).
  - [ ] `tests/unit/services/providers.test.ts` — sanitize quita `<script>`, conserva `<b>`, slug con colisión.
  - [ ] `tests/integration/providers/crud.test.ts` — round-trip GET/POST/PATCH/DELETE; 409 en POST duplicado; 404 sin perfil; soft-delete preserva fila.
  - [ ] `tests/integration/providers/auth.test.ts` — sin sesión 401; sesión de vecino 404 (sin perfil) o 200 (con perfil propio).

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Cambiar `providerCreateSchema` para que NO exija `tradeId` → `POST` con `{}` debe pasar Zod y romper `tests/integration/providers/crud.test.ts` en el handler → restaurar.
- [ ] **S2** Cambiar `softDeleteProvider` para hacer `DELETE FROM providers WHERE user_id = ?` en vez de `UPDATE` → `tests/integration/providers/crud.test.ts` debe caer (la fila no debe existir físicamente después) → restaurar.
- [ ] **S3** Eliminar la sanitización de `description` en el handler → `tests/unit/services/providers.test.ts` (caso `<script>`) debe caer → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/providers.ts` y `src/lib/validators/providers.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
