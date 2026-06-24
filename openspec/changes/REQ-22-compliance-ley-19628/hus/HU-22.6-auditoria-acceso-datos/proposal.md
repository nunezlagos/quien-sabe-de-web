# Propuesta — HU-22.6 — Auditoría de acceso admin a datos personales

**Estado:** propuesta | **REQ padre:** REQ-22-compliance-ley-19628

## Contexto

El principio de "responsabilidad proactiva" de la Ley 19.628 obliga a registrar todo acceso a datos personales por parte de roles privilegiados. Hoy un admin puede consultar el perfil de cualquier user desde `/dashboard-admin` sin dejar rastro. Esta HU introduce la tabla `data_access_log` con índice `(user_id, accessed_at)`, un middleware `auditAdminAccess(action)` aplicado a `/api/v1/admin/users/**`, exige `X-Access-Reason` header no vacío para datos sensibles, y expone al propio titular un endpoint `GET /api/v1/users/me/access-log` para conocer quién vio sus datos.

## Mockups de referencia

- `mockups/dashboard-admin.html:65-105` — patrón de grilla de KPIs con cards `bg-white p-6 rounded-2xl shadow-sm border border-gray-100`; reutilizable para la tabla de audit log en `/dashboard-admin/audit`.
- `mockups/dashboard-admin.html:50-60` — header admin con avatar + nombre.

## Alternativas considered

### Opción A — Tabla `data_access_log` + middleware declarativo
- Tabla append-only con `(admin_id, user_id, action, accessed_at, reason)`.
- Middleware `auditAdminAccess('view_profile')` aplicado vía `Astro.middleware` a las rutas `/api/v1/admin/users/*`.
- Datos sensibles requieren header `X-Access-Reason` validado no vacío.
- Pro: una sola fuente de verdad; query eficiente por `(user_id, accessed_at)` para que cada titular consulte su propio log.
- Contra: la tabla crece linealmente con accesos admin; aceptable (decenas/mes, no millones).

### Opción B — Log a servicio externo (Cloudflare Logpush)
- Pro: storage separado.
- Contra: complica el "show me my audit log" del titular (requiere UI custom que lea del servicio externo).

### Opción C — Log a consola (stdout) parseado por Logflare
- Pro: cero cambios de schema.
- Contra: el titular no puede consultar su log sin acceso a Logflare; rompe el principio de transparencia.

## Decisión

Se elige **Opción A**. Tabla en D1 con índice compuesto, middleware declarativo. El titular puede consultar su log via endpoint estándar, igualando el patrón de "export de datos" (HU-22.3).

## Riesgos y mitigaciones

- Riesgo: el middleware agrega latencia a cada request admin → Mitigación: insert es asíncrono (no awaited en el critical path); el handler puede retornar antes de que el insert complete. Si el insert falla, se loguea a consola para reconciliación manual.
- Riesgo: el admin puede bypasear el header `X-Access-Reason` enviando string vacío `""` → Mitigación: Zod `z.string().trim().min(1)` rechaza whitespace-only y vacío.
- Riesgo: el titular pide su log y ve IDs de admins sin contexto → Mitigación: join con `users` para mostrar `display_name` del admin (no email); documentar.

## Métrica de éxito

- `GET /api/v1/admin/users/42` con sesión admin → fila en `data_access_log` con `(admin_id, user_id=42, action='view_profile')`.
- `GET /api/v1/admin/users/42/raw-docs` sin header → 400.
- `GET /api/v1/admin/users/42/raw-docs` con `X-Access-Reason: "Fiscalización"` → 200 + fila con `reason="Fiscalización"`.
- `GET /api/v1/users/me/access-log` → lista de accesos admin a mis datos.
- Sabotaje: olvidar la inserción en `data_access_log` → user titular pide su log y recibe lista vacía tras acceso real → test verifica fila presente → restaurar.