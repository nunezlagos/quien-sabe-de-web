# HU-01.7 — Tasks técnicas

## T1 — Schema `is_demo` en `users`

- Editar `src/database/schema.ts`:
  - Agregar columna `is_demo: integer('is_demo', { mode: 'boolean' }).notNull().default(false)`
- Generar migración: `docker exec quien-sabe-app bun run db:generate`
- Aplicar local: `docker exec quien-sabe-app bun run db:migrate:local`
- Verificar con `make studio` que la columna existe

## T2 — Generar hashes demo

- Crear `scripts/hash-demo.ts` (one-off, ejecutar y descartar)
- Correr el script y guardar los 3 hashes resultantes en una variable local
- NO commitear el script con la contraseña plana visible en logs

## T3 — Migración `seed_users_demo`

- Crear `src/database/migrations/00XX_seed_users_demo.sql`
- Pegar los 3 hashes generados en T2 (literalmente, son strings PBKDF2 con salt)
- Probar idempotencia: aplicar 2 veces seguidas con `db:migrate:local`

## T4 — Helper `seedDemoUsers`

- Crear `src/lib/services/auth/seed.ts` con:
  - `seedDemoUsers(env: Env): Promise<void>` — útil para invocar desde bootstrap programático
  - `getDemoCredentials(): { email: string; password: string; role: string }[]` — para tests
- Helper **NO** se usa en producción (gate por `ENV=production`)

## T5 — Provider demo para prestador

- Crear `src/database/migrations/00XX_seed_provider_demo.sql` (depende de T3 + de tabla `providers`)
- Solo si existe la tabla `providers` al momento del seed

## T6 — Gate de prod

- Editar `scripts/bootstrap-prod.ts` (o el equivalente actual) para que sáltese el seed en `ENV=production`
- Documentar en README la sección "Demo vs Producción"

## T7 — Tests

- `tests/integration/auth/seed.test.ts`:
  - Seed crea exactamente 3 usuarios con `is_demo=1`
  - Seed es idempotente
  - `vecino@demo.cl` + `Demo1234` → 200 en login
  - `prestador@demo.cl` + `Demo1234` → 200
  - `admin@demo.cl` + `Demo1234` → 200
  - `noexiste@demo.cl` + `Demo1234` → 401
  - `vecino@demo.cl` + `WrongPass` → 401
- `tests/unit/services/auth/seed.test.ts`:
  - `getDemoCredentials()` retorna 3 entradas

## T8 — Documentación

- Actualizar `README.md` con sección "Demo" listando los 3 usuarios y la contraseña
- Actualizar `.env.example` con comentario `DEMO_PASSWORD=Demo1234` (referencial)

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Login manual con los 3 usuarios funciona en `localhost:4323`
- [ ] Sabotaje 1: borrar fila de `vecino@demo.cl` → login devuelve 401 (no "usuario no existe")
- [ ] Sabotaje 2: cambiar un byte del hash de `prestador@demo.cl` → login devuelve 401
- [ ] Sabotaje 3: aplicar la migración 3 veces seguidas → siguen habiendo 3 filas (idempotencia)
- [ ] Coverage ≥ 90 % en `src/lib/services/auth/seed.ts`
- [ ] Type check verde
- [ ] Cumple `openspec/CONVENTIONS.md`
- [ ] Commit `feat: seed de usuarios demo con flag is_demo` y push