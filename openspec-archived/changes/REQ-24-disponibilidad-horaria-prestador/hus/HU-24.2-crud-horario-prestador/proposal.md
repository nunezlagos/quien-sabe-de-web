# Propuesta — HU-24.2 — CRUD horario semanal del prestador

**Estado:** propuesta | **REQ padre:** REQ-24-disponibilidad-horaria-prestador

## Con contexto

Una vez que la tabla `provider_availability` existe (HU-24.1), el prestador necesita declarar su horario semanal. Esta HU entrega los endpoints GET (público y propio) y PUT (reemplazo atómico del arreglo) más la UI semanal en el dashboard, con validación de solapamiento por día. La UI se apoya en el patrón visual de `mockups/dashboard-provider.html:229-352` (cards `bg-gray-50 rounded-2xl border border-gray-100 p-4` con toggle por día).

## Mockups de referencia

- `mockups/dashboard-provider.html:229-352` — sección "Mi Horario de Atención" con grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3` y un card por día con toggle + 2 inputs `type="time"`.
- `mockups/dashboard-provider.html:240-254` — card "Lunes" con `flex justify-between items-center mb-3` (label + toggle) + `flex items-center gap-2` (2 inputs).

## Alternativas consideradas

### Opción A — PUT reemplaza el arreglo completo (delete + insert en transacción)
- Cliente envía `[{day:1, start:'09:00', end:'13:00'}, {day:1, start:'15:00', end:'19:00'}]`. El backend borra todos los rows del provider e inserta los nuevos en una transacción.
- Pro: estado siempre consistente; el cliente ve un único PUT en lugar de N PATCHes.
- Pro: simple de razonar ("la lista vigente es exactamente esto").
- Contra: si dos clientes modifican a la vez, el último gana (last-write-wins). Aceptable para este caso de uso (un prestador edita a la vez).

### Opción B — PATCH por rango (insert/delete/update granular)
- Pro: cambios pequeños no reescriben todo.
- Contra: requiere reconciliación; el cliente puede quedar con estado inconsistente si una request falla a mitad.

### Opción C — Upsert individual por `(provider, day, start_time)`
- Pro: idempotente.
- Contra: para borrar un rango hay que hacer DELETE explícito; complica el cliente.

## Decisión

Se elige **Opción A**. La interfaz "el horario vigente es este arreglo" es la más clara para el prestador; PUT atómico con delete + insert resuelve inconsistencias de forma natural.

## Riesgos y mitigaciones

- Riesgo: PUT con arreglo que solapa rangos en el mismo día → Mitigación: validación Zod + helper `validateNoOverlap(ranges)` rechaza con 422 + mensaje específico por día solapado.
- Riesgo: el toggle por día (mockup línea 245) sugiere "este día no trabajo" → Mitigación: la opción "día cerrado" se modela como ausencia de rangos; el toggle controla si se renderiza el bloque o no, pero en data siempre es ausencia.
- Riesgo: timezone inconsistente al renderizar → Mitigación: el input `type="time"` entrega valor local del browser; HU-24.3 hace la conversión a America/Santiago.

## Métrica de éxito

- PUT con 3 rangos válidos (lun 09-13, lun 15-19, mar 09-13) → 200, tabla queda con exactamente esas 3 filas.
- PUT con solapamiento `[{lun 09-12}, {lun 11-13}]` → 422 con `{error: 'rangos solapados día 1'}`.
- GET `/api/v1/providers/me/availability` con sesión prestador → 200 con el arreglo actual.
- GET `/api/v1/providers/42/availability` público → 200 con el arreglo del prestador 42.
- E2E: dashboard renderiza 7 cards (uno por día) con los rangos actuales pintados.
- Sabotaje: en el service, olvidar la transacción → test con INSERT 2 inválido detecta fila huérfana → restaurar.