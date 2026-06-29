# Propuesta — HU-15.2 — CRUD de gastos admin

**Estado:** propuesta | **REQ padre:** REQ-15-transparencia-publica

## Contexto

Sin una interfaz administrativa para registrar gastos, la página `/transparency` quedaría vacía y el reporte mensual no tendría datos. Esta HU habilita al rol admin a crear, editar y eliminar entradas de la tabla `expenses` que alimentan los widgets públicos (OE3 transparencia radical).

## Mockups de referencia

- `mockups/dashboard-admin.html:268-274` — sección "Finanzas" placeholder ("Próximamente") donde se montará el `ExpensesManager`. UI a diseñar siguiendo el estilo del resto del dashboard admin.
- `mockups/dashboard-admin.html:287-342` — patrón modal "user-modal" reutilizable para el formulario crear/editar gasto (inputs grid, labels en negrita, botón submit primary).
- `mockups/transparency.html:66-97` — tabla pública que mostrará las filas creadas vía este CRUD (referencia de los campos visibles al final).

## Alternativas consideradas

### Opción A — Endpoints REST + formulario modal en isla
- Endpoints `POST/PATCH/DELETE /api/v1/admin/expenses` + componente Astro `ExpensesManager.astro` con isla cliente para abrir modal.
- Pro: separación clara backend/frontend; reuso del patrón de modales del dashboard admin (`mockups/dashboard-admin.html:287`); cacheable y testeable independientemente.
- Contra: requiere hidratación parcial; más archivos.

### Opción B — Server actions Astro embebidas en la página
- Sin endpoints REST: todo via formularios `<form action="/admin/expenses" method="POST">` que disparan handlers en `src/pages/admin/expenses.astro`.
- Pro: cero JS cliente.
- Contra: rompe el contrato `/api/v1/admin/...` declarado en `req.md`; impide reuso desde otros frontends; no compatible con tests de contrato.

## Decisión

Se elige Opción A. El REQ establece explícitamente endpoints REST `/api/v1/admin/expenses` (ver `req.md:27-29`), y el dashboard admin ya usa un patrón de modal islas para todos los recursos. Mantener consistencia con el resto del proyecto y permitir auditoría/test de contrato pesa más que el ahorro de JS.

## Riesgos y mitigaciones

- Riesgo: admin elimina un gasto que ya está congelado en `monthly_reports` del mes anterior → Mitigación: el endpoint DELETE solo borra fila de `expenses`; el snapshot histórico en `monthly_reports` queda intacto. Auditar en log.
- Riesgo: subida de documentos R2 mezclada con creación de gasto fuerza body multipart → Mitigación: separar en dos pasos (HU-15.6 maneja upload presigned y un PATCH posterior asocia `document_r2_key`).
- Riesgo: vecino no-admin alcanza endpoint → Mitigación: middleware `requireAdmin` previo (ya provisto por REQ-13).

## Métrica de éxito

- Admin autenticado puede crear, editar y eliminar gastos desde `/admin#finances-section` y ver el cambio reflejado en `/transparency` tras invalidar cache.
- Usuario con rol "vecino" recibe 403 en cualquiera de los tres endpoints.
- Tests de integración cubren los 4 escenarios Gherkin del `hu.md`.
