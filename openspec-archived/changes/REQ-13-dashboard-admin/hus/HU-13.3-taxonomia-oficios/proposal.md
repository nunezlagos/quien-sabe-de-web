# Propuesta — HU-13.3 — CRUD de oficios (trades) con reorder

**Estado:** propuesta | **REQ padre:** REQ-13-dashboard-admin

## Contexto

La taxonomía de oficios es compartida entre prestadores (seleccionan oficios en su perfil), el buscador y la UI pública. El admin debe poder crear nuevos oficios, renombrar los existentes (sin cambiar el slug, que es estable y se usa en URLs y filtros), reordenar via drag & drop, y eliminar — pero NO eliminar si el oficio está en uso. La propuesta cubre los 4 endpoints y la UI con drag & drop usando SortableJS (librería ya disponible vía CDN en el proyecto, verificada en `mockups/dashboard-admin.html`).

## Mockups de referencia

- `mockups/dashboard-admin.html:189-265` — sección "Mantenedor Oficios" con tabla (Nombre, Categoría, Acciones) + subsección "Solicitudes de Aprobación" (out of scope acá, vive en REQ-03). Replicamos la tabla y agregamos una columna extra "Orden" + handles de drag.
- `mockups/dashboard-admin.html:344-386` — modal "Nuevo Oficio" con campos Nombre, Categoría, Descripción Corta. Adaptamos el modal a nuestro modelo (slug autogenerado desde nombre; descripción opcional).

## Alternativas considered

### Opcion A — Tabla `trades` extendida con `sort_order INTEGER`, slug inmutable, FK protect en delete
- Schema Drizzle extiende `trades` con `sort_order`. DELETE protegido por check de uso en `provider_trades`.
- Pro: coherente con el patrón actual (trades ya existe en REQ-02).
- Pro: slug inmutable permite URLs estables (REQ-06 buscador).
- Contra: requiere migración aditiva para `sort_order`.

### Opcion B — Tabla aparte `trade_reorder_queue` con flag `pending_publish`
- Drag & drop sólo marca reordenamiento; un job nocturno aplica el reorder.
- Pro: drag UX sin latencia.
- Contra: complejidad innecesaria para una operación que se ejecuta <1 vez/mes.

### Opcion C — Reordenar por nombre alfabético sin `sort_order`
- Cero esquema nuevo; el orden es siempre alfabético.
- Pro: trivial.
- Contra: el admin no tiene control (REQUISITO explícito del HU: drag & drop).

## Decision

Se elige **Opcion A**. `sort_order` es la forma estándar de modelar orden manual en SQL sin caer en alfabetización forzada. El slug se congela al crear y NO cambia con rename (constraint `CHECK` o invariante de aplicación). El DELETE protegido por check de uso retorna 409 con error claro.

## Riesgos y mitigaciones

- Riesgo: dos admins reordenan al mismo tiempo → Mitigación: el endpoint `POST /reorder` espera el array completo de IDs y hace UPDATE en transacción; el último gana (con audit log de quién reordenó).
- Riesgo: drag & drop con teclado (a11y) → Mitigación: SortableJS soporta navegación con teclado out-of-the-box; verificamos en E2E que `Tab` + `Space` + flechas funcionan.
- Riesgo: rename rompe búsquedas existentes con el nombre viejo → Mitigación: aceptable; el buscador indexa por slug (REQ-06), no por nombre.

## Metrica de exito

- POST `/api/v1/admin/trades` con `{"name":"Cerrajero","slug":"cerrajero"}` → 201 + fila creada.
- DELETE oficio en uso por al menos 1 provider → 409 con `{"error":"oficio en uso"}`.
- POST `/api/v1/admin/trades/reorder` con `{"order":[3,1,2,5,4]}` → `sort_order` actualizado.
- PATCH name → name actualizado, slug intacto.
- E2E: admin reordena → recarga → orden persiste.
