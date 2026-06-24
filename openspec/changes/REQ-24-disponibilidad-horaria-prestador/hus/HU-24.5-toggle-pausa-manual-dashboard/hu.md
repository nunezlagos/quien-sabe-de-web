# HU-24.5 — Toggle global Disponible/Pausa manual desde dashboard

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-24-disponibilidad-horaria-prestador

## Historia de usuario

**Como** prestador
**Quiero** un toggle global en el sidebar de mi dashboard para pausar mi disponibilidad manualmente
**Para** dejar de recibir contactos por un rato (vacaciones, día libre, emergencia) sin tener que editar mi horario semanal

## Contexto

La disponibilidad automática (HU-24.3) se calcula a partir de los rangos
semanales declarados (HU-24.2). Pero hay situaciones donde el prestador
quiere pausar **todo** sin editar su horario (vacaciones, enfermedad,
emergencia). Esta HU agrega un toggle manual `manual_availability` que
tiene prioridad sobre el cálculo automático.

## Relación con otros HUs

- HU-24.2 (CRUD horario semanal) → define los rangos base.
- HU-24.3 (badge "Disponible ahora") → calcula disponibilidad; **esta HU extiende** la firma de `isAvailableNow` para considerar `manualAvailability`.
- HU-24.4 (filtro buscador) → si el prestador está en pausa manual, NO debe aparecer con `available_now=true`.

## Criterios de aceptación (Gherkin)

### Escenario: Toggle OFF marca prestador como pausado
  Dado prestador con `manual_availability=1` (default) y rango lunes 09-13
  Cuando envío `PATCH /api/v1/providers/me/availability/toggle` con `{"enabled": false}`
  Entonces la columna `manual_availability` se actualiza a `0`
  Y `isAvailableNow(ranges, 0, now, tz)` retorna `false` aunque `now` esté dentro del rango
  Y el sidebar del dashboard muestra label "En pausa"
  Y el badge público cambia a gris "Pausado temporalmente"

### Escenario: Toggle ON reactiva disponibilidad
  Dado prestador con `manual_availability=0`
  Cuando envío PATCH con `{"enabled": true}`
  Entonces la columna vuelve a `1`
  Y el cálculo automático se respeta (mismo comportamiento que HU-24.3)

### Escenario: PATCH idempotente
  Dado `manual_availability=1`
  Cuando envío PATCH con `{"enabled": true}`
  Entonces sigue siendo `1` (sin error, sin cambio observable)

### Escenario: PATCH sin sesión
  Cuando envío PATCH sin cookie `session`
  Entonces recibo 401

### Escenario: PATCH con sesión vecino (no prestador)
  Dado usuario con rol `vecino`
  Cuando envío PATCH
  Entonces recibo 403 (solo prestador puede pausar su disponibilidad)

### Escenario: PATCH con body inválido
  Cuando envío `{"enabled": "yes"}` (string en vez de boolean)
  Entonces recibo 400 con detalles de validación Zod

### Escenario: Prestador pre-existente conserva default
  Cuando se aplica la migración con `DEFAULT 1`
  Entonces todos los prestadores existentes quedan con `manual_availability=1`
  Y no se requiere acción manual

### Escenario: Buscador con `available_now=true` excluye pausados
  Dado prestador A con rango lunes 09-13 y `manual_availability=0`
  Y prestador B con mismo rango y `manual_availability=1`
  Cuando vecino busca con `?available_now=true` un lunes 10:00
  Entonces solo aparece B

## Tareas técnicas

- [ ] **T1** Agregar columna `manual_availability INTEGER NOT NULL DEFAULT 1` a `providers` en `src/database/schema.ts` (sin índice nuevo; lookup por PK).
- [ ] **T2** Generar migración con `CHECK (manual_availability IN (0,1))`.
- [ ] **T3** Aplicar migración local y verificar DEFAULT 1 con Drizzle Studio.
- [ ] **T4** Validador `toggleAvailabilitySchema` en `src/lib/validators/availability.ts` (Zod, `{enabled: boolean}`).
- [ ] **T5** Servicio `src/lib/services/availability/toggle.ts` con `setManualAvailability(env, providerId, enabled)` y `getManualAvailability(env, providerId)`.
- [ ] **T6** Extender `src/lib/services/availability/now.ts` (HU-24.3): `isAvailableNow(ranges, manualAvailability, now, tz)` retorna `false` si `manualAvailability === 0`.
- [ ] **T7** Endpoint `src/pages/api/v1/providers/me/availability/toggle.ts` (PATCH, sesión prestador).
- [ ] **T8** Componente `src/components/availability/AvailabilityToggle.astro` con prop `{initialEnabled}`. Isla `client:load` con PATCH optimista.
- [ ] **T9** Integrar `AvailabilityToggle` en `src/components/dashboard/provider/SidebarNav.astro` (HU-12.1).
- [ ] **T10** Extender `src/components/availability/AvailabilityBadge.astro` (HU-24.3) para aceptar prop `manualAvailability`. Si `0` → badge gris "Pausado temporalmente".
- [ ] **T11** Pasar `manualAvailability` desde `src/pages/p/[slug].astro` (REQ-07) al badge público.
- [ ] **T12** Lógica de cliente del toggle en `src/lib/client/availability/toggle.ts` (regla R2 — sin JS inline en el componente).
- [ ] **T13** Estilos del toggle y badge en `src/styles/components.css` (regla R1 — sin estilos inline).

## Mockup pendiente (gap detectado)

Esta HU requiere una sección "Estado / Disponibilidad" en el sidebar de
`mockups/dashboard-provider.html` con el toggle. **Crear mockup como
parte de esta HU** (T14).

- [ ] **T14** Extender `mockups/dashboard-provider.html` con bloque toggle:
  - Card pequeña arriba del sidebar nav
  - Icono + label "Estado"
  - Toggle switch (visual)
  - Texto debajo: "Visible para vecinos" / "En pausa"

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración)
- [ ] Tests E2E Playwright → verde
- [ ] Sabotaje 1: en `isAvailableNow`, comentar `&& manualAvailability === 1` → test unitario rojo → restaurar
- [ ] Sabotaje 2: en el endpoint, no verificar el rol prestador → test integración con sesión vecino da 200 → restaurar
- [ ] Sabotaje 3: en la migración, olvidar `DEFAULT 1` → prestadores pre-existientes quedan con `manual_availability=null`; test integración con fixture rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/availability/toggle.ts`, `src/lib/validators/availability.ts`
- [ ] Type check verde
- [ ] Cero `style="..."` inline en componentes creados (R1)
- [ ] JS del toggle extraído a `.ts` aparte (R2)
- [ ] PR mergeado a `develop` vía `/respaldo`