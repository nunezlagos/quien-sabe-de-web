# HU-01.7 — Proposal: Seed de usuarios demo

## Por qué

En esta fase el proyecto no tiene registro público (REQ-01 explícitamente
lo difiere). Sin un set de usuarios pre-creados, no se puede probar el
flujo de login ni los dashboards. Necesitamos un seed determinístico,
idempotente y marcado con `is_demo=1` para distinguirlo de usuarios
reales futuros.

## Alternativas consideradas

| Alternativa | Pro | Contra | Decisión |
|---|---|---|---|
| **Seed SQL con hashes hardcodeados** | Simple, una sola migración | Hashes PBKDF2 fijos → vulnerable si el repo se filtra | ❌ |
| **Seed programático desde el worker de bootstrap** | Calcula hash en runtime con salts aleatorias | Acopla bootstrap a lógica de seed | ⚠️ |
| **Seed SQL con `INSERT OR IGNORE` + hash precalculado de `Demo1234` con salt fija** | Idempotente, determinístico, sin acoplar bootstrap | Hash conocido en repo → aceptable porque es solo para demo local | ✅ |
| **Seed híbrido: SQL para estructura (`is_demo`, emails), TS para hashes** | Máxima seguridad | Más complejo, dos archivos a sincronizar | ❌ sobre-ingeniería |

## Decisión final

**Migración SQL** (`00XX_seed_users_demo.sql`) con `INSERT OR REPLACE` (SQLite)
para los 3 usuarios demo. Los `password_hash` se pre-calculan con PBKDF2 y
se commitean al repo **solo en este archivo de migración** porque es la
forma más simple y mantenible.

Para mayor seguridad:
- El seed solo se aplica en `db:migrate:local` y en staging.
- En prod, la migración existe pero el script `bootstrap:prod` la saltea
  si la variable `ENV=production`.

## Forma del seed

```sql
-- src/database/migrations/00XX_seed_users_demo.sql
INSERT OR REPLACE INTO users (id, email, password_hash, role, status, is_demo, created_at)
VALUES
  (1, 'vecino@demo.cl',     '<hash Demo1234>', 'vecino',    'active', 1, strftime('%s','now')),
  (2, 'prestador@demo.cl',  '<hash Demo1234>', 'prestador', 'active', 1, strftime('%s','now')),
  (3, 'admin@demo.cl',      '<hash Demo1234>', 'admin',     'active', 1, strftime('%s','now'));
```

> Los hashes se generan UNA vez con el script `bun run scripts/hash-demo.ts`
> y se pegan en la migración. **Nunca** commitear la contraseña plana.

## Impacto en otros HUs

- HU-01.1 (login): el seed es prerequisito para que `POST /auth/iniciar-sesion` tenga usuarios contra los que validar.
- HU-11 (dashboard-vecino): depende de que `vecino@demo.cl` exista.
- HU-12 (dashboard-prestador): depende de `prestador@demo.cl`.
- HU-13 (dashboard-admin): depende de `admin@demo.cl`.
- HU-21 (onboarding-prestador): el flujo de "convertir vecino en prestador" usa `vecino@demo.cl` como punto de partida para la demo.

## Riesgos y mitigación

- **Hash conocido en repo**: aceptable porque es solo para demo local. Si se filtra, un atacante podría obtener el hash de `Demo1234` y hacer rainbow tables → mitigado porque ese hash solo es válido en el entorno demo, no en prod.
- **Confusión con usuarios reales**: mitigado con columna `is_demo=1` que permite filtrar/eliminar todo el set demo con un `DELETE FROM users WHERE is_demo=1`.
- **Migración rota en prod**: gate por variable `ENV` en el script de bootstrap.