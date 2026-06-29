# Propuesta — HU-04.1 — Schema providers + trades con seed

**Estado:** propuesta | **REQ padre:** REQ-04-perfil-prestador

## Contexto

REQ-04 requiere modelar dos entidades núcleo: `providers` (perfil editable
del prestador, vinculado 1:1 al `users` autenticado) y `trades` (taxonomía
cerrada de oficios definida por admin en REQ-13). El modelo condiciona
todo lo demás del REQ-04 (CRUD, foto, reindex) y habilita REQ-05, REQ-06,
REQ-07 y REQ-12. El schema debe garantizar unicidad de `user_id` para
impedir perfiles duplicados por la misma cuenta, e imponer `slug` único en
`trades` para que el buscador (REQ-06) pueda resolver `?trade=<slug>`.

## Mockups de referencia

- HU 100% backend (DDL). No tiene UI directa. Los datos se consumen desde:
  - `mockups/dashboard-provider.html:34-66` — sidebar de prestador donde se muestra oficio (`Gasfiter`) y comuna. La columna `trade_id` de `providers` se renderiza acá.
  - `mockups/index.html:76-111` — hero search de la home con `<select id="trade-select">` poblado desde el catálogo `trades`. UI a diseñar siguiendo este patrón.
  - `mockups/profile.html:69` — `<span id="profile-trade">` muestra el nombre legible del oficio.

## Alternativas consideradas

### Opcion A — Tabla dedicada `providers` con FK a `users`, `trades`, `communes`
- `providers.user_id` con `UNIQUE` constraint; FKs explícitas con `ON DELETE` definido por tabla.
- Pro: integridad referencial explícita, Drizzle infiere tipos seguros, queries de join predecibles.
- Pro: el `UNIQUE(user_id)` es la pieza que evita el escenario "Crear perfil duplicado → 409" de HU-04.2 sin tener que manejarlo en capa de aplicación.
- Contra: requiere migrar `communes` (REQ-02) antes — dependencia dura.

### Opcion B — Reutilizar `users` extendiendo columnas (`users.trade_id`, etc)
- Agregar `trade_id`, `commune_id`, `description`, `photo_r2_key` directamente a `users`.
- Pro: menos joins para queries simples, una sola tabla.
- Contra: acopla la cuenta de autenticación (REQ-01) con datos de dominio editables; rompe el principio de "tabla de identidad = inmutable salvo email/password".
- Contra: un vecino sin perfil de prestador ocupa todas esas columnas en NULL; modelado ruidoso.

### Opcion C — Polimórfica `provider_profiles` con JSON de metadatos
- Tabla con `metadata JSON` libre para cada campo.
- Pro: flexible para añadir campos sin migración.
- Contra: imposible validar `trade_id` y `commune_id` como FK; rompe REQ-06 (filtros por oficio/comuna) y complica agregaciones para OE1.

## Decision

Se elige **Opcion A**. Modelar `providers` y `trades` como tablas dedicadas
con FKs y `UNIQUE(user_id)` es lo único que cumple los criterios de
aceptación de esta HU y mantiene una frontera limpia entre identidad
(`users`) y dominio (`providers`). El costo de migración es marginal; el
beneficio se ve en cada query que REQ-05/06/07 va a hacer durante toda
la vida del producto.

## Riesgos y mitigaciones

- Riesgo: FKs no se enforcen en D1 si `PRAGMA foreign_keys = ON` no se setea → Mitigación: tarea de verificación en HU-04.1 (test integration que inserta provider con `user_id` inexistente y espera error de FK).
- Riesgo: seed de `trades` diverge entre local y prod → Mitigación: `INSERT OR IGNORE` (idempotente) en una migración dedicada `0002_seed_trades.sql` que se aplica cada vez.
- Riesgo: agregar un oficio nuevo en el futuro requiera migración → Mitigación: documentar que la taxonomía se edita vía SQL (admin usa dashboard REQ-13 que dispara migración generada).

## Metrica de exito

- La migración aplica en D1 local sin errores: `docker exec quien-sabe-app bun run db:migrate:local`.
- `INSERT INTO providers (user_id) VALUES (10)` dos veces seguidas → la segunda falla con `UNIQUE constraint failed: providers.user_id`.
- `SELECT COUNT(*) FROM trades` retorna ≥ 5 (oficios mínimos del seed).
- `EXPLAIN QUERY PLAN` sobre `WHERE user_id = ?` usa el índice implícito de la PK / `UNIQUE`.
