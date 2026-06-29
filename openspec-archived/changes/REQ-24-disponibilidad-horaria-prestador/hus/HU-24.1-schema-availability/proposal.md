# Propuesta — HU-24.1 — Esquema provider_availability

**Estado:** propuesta | **REQ padre:** REQ-24-disponibilidad-horaria-prestador

## Contexto

El REQ-24 introduce disponibilidad semanal por prestador pero no tiene dónde persistirla. Esta HU entrega la tabla `provider_availability(provider_id, day_of_week, start_time, end_time)` con PK compuesta, constraint UNIQUE para evitar duplicados `(provider, day, start)`, CHECK que `end_time > start_time`, y soporte para múltiples rangos por día (ej. lunes 09-13 y lunes 15-19). Es 100% DDL/backend; la UI vive en HU-24.2.

## Mockups de referencia

No aplica (HU backend). El consumidor visual es `mockups/dashboard-provider.html:229-352` (sección "Mi Horario de Atención" que HU-24.2 implementa).

## Alternativas consideradas

### Opción A — Tabla `provider_availability` con TEXT HH:MM
- `start_time TEXT NOT NULL CHECK (start_time GLOB '[0-2][0-9]:[0-5][0-9]')`, igual para `end_time`. Formato canónico HH:MM 24h.
- Pro: SQLite no tiene TIME nativo; TEXT es la forma idiomática de almacenar tiempo en D1.
- Pro: legible en queries `WHERE start_time <= '13:00'`.
- Contra: requiere validación regex en migración o en el servicio.

### Opción B — Columnas enteras (minutos desde 00:00)
- `start_min INTEGER NOT NULL` con valores 0-1440.
- Pro: aritmética trivial (`end_min - start_min` para duración).
- Contra: menos legible en queries; requiere conversión cada vez que se muestra al usuario.

### Opción C — Tabla por día con columna tipo BIT
- Pro: un solo rango por día.
- Contra: el requisito explícito es "múltiples rangos por día"; este modelo no lo soporta.

## Decisión

Se elige **Opción A**. TEXT HH:MM es legible, portable a otros motores SQL, y suficiente para la lógica de overlap que HU-24.2 implementa. La validación de formato se hace en Zod (capa servicio) y como CHECK en SQL (capa DB).

## Riesgos y mitigaciones

- Riesgo: CHECK con regex SQLite es frágil → Mitigación: usar `CHECK (start_time GLOB '[0-2][0-9]:[0-5][0-9]')` para HH:MM básico; la validación completa (00-23 horas, 00-59 minutos, end > start) vive en Zod. El CHECK es red de seguridad, no la única defensa.
- Riesgo: timezone almacenada implícitamente en America/Santiago → Mitigación: documentar en comentario de schema; el helper `isAvailableNow` de HU-24.3 hace la conversión explícita.
- Riesgo: la PK compuesta `(provider_id, day_of_week, start_time)` no permite 2 rangos que empiecen a la misma hora → Mitigación: la validación de duplicados es correcta (no deberían existir dos rangos idénticos). Si el prestador quiere "lunes 9-13 y lunes 9-13" son el mismo rango, no se duplica.

## Métrica de éxito

- `CREATE TABLE provider_availability` aplica vía migración sin errores.
- INSERT `(provider_id=1, day_of_week=1, start_time='14:00', end_time='09:00')` falla con `CHECK constraint failed: end_time > start_time`.
- INSERT `(1, 1, '09:00', '13:00')` y `(1, 1, '15:00', '19:00')` coexisten.
- INSERT duplicado `(1, 1, '09:00', '13:00')` dos veces falla con UNIQUE constraint.
- Sabotaje: olvidar el `CHECK (end_time > start_time)` → INSERT con end < start persiste → test con INSERT inválido verifica rollback → restaurar.