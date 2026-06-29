# Propuesta — HU-13.1 — Middleware estricto para rutas admin

**Estado:** propuesta | **REQ padre:** REQ-13-dashboard-admin

## Contexto

Cualquier acceso no-admin a `/dashboard-admin` o `/api/v1/admin/**` es un riesgo de seguridad: expone CRUD de usuarios, métricas financieras, settings globales y el log de auditoría. Hoy no hay un guard centralizado; cada endpoint valida por su cuenta (con riesgo de olvido). Proponemos un middleware único `requireAdmin` que se enchufa en `src/middleware.ts` y cubre todos los prefijos admin, con dos modos de respuesta (302 para rutas de página, 403 para APIs) y registro de auditoría por acceso.

## Mockups de referencia

Esta HU es 100% backend (middleware + endpoint). Los consumidores UI son las secciones de `mockups/dashboard-admin.html:268-282` (Finanzas, Configuración — placeholders "Próximamente" que HU-13.5/13.6 llenan) y `mockups/dashboard-admin.html:147-186` (Users).

## Alternativas considered

### Opcion A — Helper `requireAdmin(ctx)` invocado al inicio de cada handler `/api/v1/admin/**` + guard en `src/middleware.ts` para `/dashboard-admin*`
- Helper compartido + middleware para la ruta HTML.
- Pro: defense-in-depth (dos capas).
- Pro: helper reutilizable desde server-only code (ej: WebSocket admin).
- Contra: requiere disciplina de invocación en cada nuevo endpoint admin.

### Opcion B — Un único guard en `src/middleware.ts` que matchea TODOS los prefijos admin (HTML y API)
- Cero invocación manual; el middleware decide todo.
- Pro: imposible olvidarse.
- Contra: middlewares globales son más difíciles de testear unitariamente (necesitan simular `Astro.request`).

### Opcion C — Middleware por archivo (`src/pages/api/v1/admin/_middleware.ts`)
- Patrón nativo de Astro para agrupar handlers.
- Pro: aislado del middleware global.
- Contra: anidación profunda, difícil de reutilizar entre `/api/v1/admin/*` y `/dashboard-admin*`.

## Decision

Se elige **Opcion A**. La combinación helper + middleware es la más testeable (helper unitario puro, middleware integración) y la más explícita (cada endpoint admin declara su requisito). El helper también se invoca desde jobs programados o futuros server-only endpoints que no son Astro.

## Riesgos y mitigaciones

- Riesgo: el middleware global corre en cada request y agrega latencia → Mitigación: el chequeo de rol es una comparación de string en memoria después de la lookup de sesión (que ya está cacheada).
- Riesgo: olvidarse de invocar `requireAdmin` en un endpoint nuevo → Mitigación: además del helper, un test E2E recorre todas las rutas `/api/v1/admin/*` y verifica que responden 403 sin admin.
- Riesgo: el log de auditoría crece sin control → Mitigación: el middleware usa sampling configurable en `settings` (REQ-13.6) — default 100% en prod, 0% en dev.

## Metrica de exito

- Vecino autenticado GET `/dashboard-admin` → 403.
- Sin sesión GET `/dashboard-admin` → 302 a `/login?next=/dashboard-admin`.
- Prestador GET `/api/v1/admin/users` → 403.
- Admin GET `/dashboard-admin` → 200 y fila nueva en `admin_audit_log` con `path` y `timestamp`.
- Test E2E: barrido de todas las rutas admin → todas 403 sin admin, todas 200/2xx con admin.
