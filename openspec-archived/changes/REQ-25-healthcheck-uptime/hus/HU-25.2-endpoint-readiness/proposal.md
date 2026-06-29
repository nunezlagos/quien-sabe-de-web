# Propuesta — HU-25.2 — Endpoint /ready para deploys

**Estado:** propuesta | **REQ padre:** REQ-25-healthcheck-uptime

## Contexto

Durante un deploy, el Worker pasa por una fase de warmup en la que la app está "iniciada" pero aún no completó su setup (carga de secretos, conexiones a bindings, validación de migraciones). Distinguir "iniciado" de "listo para tráfico" es clave para que el pipeline de deploy (REQ-26) decida cuándo hacer el switch del Worker. Esta HU entrega `GET /api/v1/ready` que devuelve 200 sólo cuando el Worker está listo para tráfico (migraciones D1 aplicadas), y 503 con `reason: "warmup"` o `reason: "migrations_pending"` en caso contrario.

## Mockups de referencia

No aplica (HU backend sin UI).

## Alternativas consideradas

### Opción A — Flag en memoria `isReady: boolean` seteado tras migraciones + verificación de `drizzle_migrations.last_applied` contra artifact
- `env.__ready` flag global en el módulo del Worker; se setea en el primer request tras `await runMigrations()`.
- Endpoint compara `last_applied_hash` de `drizzle_migrations` con el hash del artifact actual.
- Pro: preciso; el endpoint sabe realmente si las migraciones pendientes son críticas.
- Contra: requiere leer la tabla `drizzle_migrations` (overhead aceptable, < 10ms).

### Opción B — Sólo flag en memoria, sin verificar migraciones
- Pro: trivial.
- Contra: deploy con migración nueva puede pasar el readiness antes de que la migración corra, sirviendo tráfico con schema viejo.

### Opción C — Sólo verificación de `drizzle_migrations`
- Pro: cubre el caso crítico.
- Contra: no distingue warmup (Worker aún iniciando) de migraciones pendientes.

## Decisión

Se elige **Opción A**. Combina ambos checks: flag en memoria para warmup + verificación de migraciones para esquema actualizado. El endpoint reporta 503 con la razón específica.

## Riesgos y mitigaciones

- Riesgo: el flag `isReady` se contamina entre tests → Mitigación: usar variable de módulo resetable sólo en modo test (`if (import.meta.env.MODE === 'test') reset()`).
- Riesgo: la query a `drizzle_migrations` agrega latencia → Mitigación: cachear el resultado por 30s en KV; verificar siempre contra cache primero.
- Riesgo: `/ready` queda 200 antes de que las migraciones corran → Mitigación: el script `npm run db:migrate:prod` se ejecuta antes del switch del Worker (pipeline REQ-26); documentar.

## Métrica de éxito

- Worker recién desplegado, antes de warmup: GET /ready → 503 `{ready: false, reason: "warmup"}`.
- Tras warmup con migraciones aplicadas: GET /ready → 200 `{ready: true, version: "<sha>"}`.
- Si el artifact tiene migración nueva no aplicada: GET /ready → 503 `{ready: false, reason: "migrations_pending"}`.
- D1 degraded pero migraciones aplicadas: /ready = 200 (no bloquea tráfico); /health = degraded (sirve para alertas).
- Sabotaje: comentar la verificación de migraciones → deploy con migración pendiente pasa el readiness → test con fixture `last_applied < expected` verifica 503 → restaurar.