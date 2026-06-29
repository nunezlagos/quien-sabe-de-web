# HU-02.1 — Catálogo de comunas RM como seed

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-02-onboarding-vecino
**Rama:** `feat/HU-02.1-catalogo-comunas`

## Tareas técnicas

- [ ] **T1** Limpiar `src/database/schema.ts`: eliminar tabla `trades` (scaffold no presente en openspec) y agregar `communes` (`id`, `name`, `slug UNIQUE`, `region`, `createdAt`).
- [ ] **T2** Helper `slugify` en `src/lib/utils/slug.ts` (kebab-case, sin acentos opcional, lowercase).
- [ ] **T3** Servicio `communes` en `src/lib/services/communes.ts` exportando `listCommunes(db, q?)` y `seedCommunes(db, communes)`. Tipo `db` portable D1 / better-sqlite3.
- [ ] **T4** Migración `src/database/migrations/0001_seed_communes.sql` con 52 comunas RM usando `INSERT OR IGNORE` (idempotente). Aplicar también a migración 0000 (regenerar via drizzle-kit).
- [ ] **T5** Endpoint `src/pages/api/v1/communes.ts` (`GET`, lectura pública) que llama a `listCommunes`.
- [ ] **T6** Tests:
  - [ ] `tests/unit/communes/slug.test.ts` — helper kebab-case.
  - [ ] `tests/integration/communes/list.test.ts` — `listCommunes` con better-sqlite3 in-memory (búsqueda, case-insensitive, vacío).
  - [ ] `tests/integration/communes/seed-idempotent.test.ts` — `seedCommunes` 2 veces seguidas → siguen 52.
- [ ] **T7** Configurar vitest: `vitest.config.ts` + scripts en `package.json` (`test`, `test:run`, `test:cov`).

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: borrar fila seed → test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/communes.ts` y `src/lib/utils/slug.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
