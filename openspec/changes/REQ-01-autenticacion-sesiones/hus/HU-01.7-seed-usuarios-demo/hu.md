# HU-01.7 — Seed de usuarios demo para autenticación en fase demo

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-01-autenticacion-sesiones

## Historia de usuario

**Como** equipo de desarrollo y demo
**Quiero** contar con un set fijo de usuarios pre-registrados (vecino, prestador, admin)
**Para** poder probar el flujo de login y los dashboards sin necesidad de un registro público

## Contexto

En esta fase el proyecto NO tiene registro público. El endpoint
`POST /api/v1/auth/registro` responde **410 Gone**. Para que el login
funcione, los usuarios vienen de un seed determinístico que aplica al
arrancar la migración inicial.

## Criterios de aceptación (Gherkin)

### Escenario: Seed crea 3 usuarios demo
  Cuando se aplica la migración `seed_users_demo`
  Entonces la tabla `users` tiene exactamente 3 filas demo
  Y cada fila tiene `status="active"` y `role` en {`vecino`, `prestador`, `admin`}
  Y los emails son:
    - `vecino@demo.cl`
    - `prestador@demo.cl`
    - `admin@demo.cl`
  Y todos tienen `password_hash` válido para la contraseña `Demo1234`

### Escenario: Re-aplicar seed es idempotente
  Dado que los 3 usuarios demo ya existen
  Cuando se vuelve a ejecutar el seed (o se hace `migrate` de nuevo)
  Entonces NO se duplican filas
  Y la cantidad sigue siendo 3 (los existentes se actualizan, no se insertan)

### Escenario: Login con credenciales demo funciona
  Dado que existe `vecino@demo.cl` con password `Demo1234`
  Cuando envío `POST /api/v1/auth/iniciar-sesion` con esas credenciales
  Entonces recibo status 200 y cookie `session` válida

### Escenario: Password demo NO se commitea a prod
  Cuando se genera la migración de seed
  Entonces el password_hash se calcula en runtime con PBKDF2 (no hardcodeado en SQL)
  Y la contraseña plana `Demo1234` solo aparece en la doc de este HU y en `.env.example`

### Escenario: Seed incluye provider asociado al prestador
  Dado que existe `prestador@demo.cl`
  Cuando se carga el seed
  Entonces existe una fila en `providers` con `user_id` apuntando a ese usuario
  Y `trade_id` es el primer oficio del catálogo seed (si existe), o `null` si aún no hay oficios

### Escenario: Marcador `is_demo` para evitar soft-delete accidental
  Cada fila seed tiene `is_demo=1` para que el admin pueda identificar y opcionalmente purgar el set demo sin afectar usuarios reales (futuros)

## Tareas técnicas

- [ ] Migración `src/database/migrations/00XX_seed_users_demo.sql` con `INSERT OR IGNORE` para los 3 usuarios (idempotente)
- [ ] Helper `hashDemoPasswords()` en `src/lib/services/auth/seed.ts` que calcula los hashes PBKDF2 de `Demo1234` para los 3 usuarios y los retorna como JSON (para que la migración los use o para una migración programática equivalente)
- [ ] Agregar columna `is_demo INTEGER NOT NULL DEFAULT 0` a `users` en `src/database/schema.ts`
- [ ] Helper `seedDemoUsers(env)` en `src/lib/services/auth/seed.ts` invocable desde seed local y desde worker de bootstrap
- [ ] Si existe tabla `providers`, crear fila demo para `prestador@demo.cl` apuntando al primer `trade_id` disponible (o crear un trade demo si la tabla está vacía)
- [ ] Tests `tests/integration/auth/seed.test.ts`:
  - Seed crea exactamente 3 usuarios
  - Seed es idempotente (segunda ejecución no duplica)
  - Login con cada credencial demo funciona
  - `is_demo=1` está seteado en los 3
- [ ] Documentar credenciales demo en `.env.example` y en `README.md` (sección "Demo")

## Definition of done

- [ ] Tests Vitest unit + integración pasan
- [ ] Login manual con cada uno de los 3 usuarios funciona
- [ ] Sabotaje: borrar la fila `vecino@demo.cl` y verificar que login devuelve 401 (no "usuario no existe" filtrable)
- [ ] Sabotaje 2: cambiar el password hash y verificar que login con `Demo1234` falla
- [ ] Coverage ≥ 90 % en `src/lib/services/auth/seed.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Cumple `openspec/CONVENTIONS.md` (sin CSS/JS inline, password hash calculado en runtime)
- [ ] PR mergeado a `develop` vía `/respaldo`

## Riesgos / notas

- La contraseña `Demo1234` es **solo para desarrollo local y demo**. En prod no debe existir el seed (gate en el script de bootstrap).
- Si más adelante se agregan más roles (ej. moderador), extender el seed con `INSERT OR IGNORE` (nunca `INSERT` plano, para mantener idempotencia).
- NO confundir este seed con futuras "cuentas demo por comuna" — esto es solo el set de 3 para autenticación base.