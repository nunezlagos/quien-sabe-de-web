# HU-01.7 — Design: Seed de usuarios demo

## Schema

Agregar columna `is_demo` a `users`:

```ts
// src/database/schema.ts
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role', { enum: ['vecino', 'prestador', 'admin'] }).notNull(),
  status: text('status', { enum: ['active', 'banned', 'deleted'] }).notNull().default('active'),
  is_demo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

## Migración

```sql
-- src/database/migrations/00XX_users_is_demo.sql
ALTER TABLE users ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0;
```

```sql
-- src/database/migrations/00XX_seed_users_demo.sql
-- Se aplica DESPUÉS de 00XX_users_password.sql
INSERT OR REPLACE INTO users (id, email, password_hash, role, status, is_demo, created_at)
VALUES
  (1, 'vecino@demo.cl',     '<HASH>', 'vecino',    'active', 1, strftime('%s','now')),
  (2, 'prestador@demo.cl',  '<HASH>', 'prestador', 'active', 1, strftime('%s','now')),
  (3, 'admin@demo.cl',      '<HASH>', 'admin',     'active', 1, strftime('%s','now'));
```

Los hashes se generan UNA vez con:

```ts
// scripts/hash-demo.ts (one-off, no se commitea al runtime)
import { hash } from '../src/lib/services/auth/contrasena';

const password = 'Demo1234';
for (const [_, email] of [['vecino', 'vecino@demo.cl'], ['prestador', 'prestador@demo.cl'], ['admin', 'admin@demo.cl']]) {
  console.log(email, await hash(password));
}
```

## Bootstrap en prod

```ts
// scripts/bootstrap-prod.ts
const ENV = process.env.ENV ?? 'development';
if (ENV === 'production') {
  console.log('SKIP seed_users_demo (prod no carga usuarios demo)');
  process.exit(0);
}
// aplicar migraciones normalmente
```

## Provider demo

Si la tabla `providers` existe al momento del seed, crear una fila para
`prestador@demo.cl` apuntando al primer `trade_id` disponible (o crear
un trade demo "Gasfiter" si la tabla está vacía).

```sql
-- src/database/migrations/00XX_seed_provider_demo.sql
INSERT OR REPLACE INTO providers (user_id, trade_id, slug, bio, status, verified, created_at)
VALUES (2, 1, 'gasfiter-demo-las-condes', 'Gasfiter demo con 10 años de experiencia.', 'active', 1, strftime('%s','now'));
```

## Convenciones aplicadas

- **R1 (sin CSS inline)**: este HU no genera markup, no aplica.
- **R2 (sin JS inline)**: el helper `hashDemoPasswords()` está en `src/lib/services/auth/seed.ts`, no inline.
- **R3 (componentes reutilizables)**: `seedDemoUsers(env)` queda en `src/lib/services/auth/seed.ts` para ser invocado desde bootstrap, desde tests, y desde scripts CLI sin duplicar lógica.