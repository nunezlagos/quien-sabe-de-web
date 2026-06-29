# Propuesta — HU-03.4 — Cola de verificación en dashboard admin

**Estado:** propuesta | **REQ padre:** REQ-03-verificacion-prestador

## Contexto

Un admin necesita revisar las solicitudes pendientes con contexto suficiente para decidir. Esta HU implementa el endpoint `GET /api/v1/admin/verifications` (paginado con cursor) y `GET /api/v1/admin/verifications/:id/documents/:docId/preview` (URL firmada GET con TTL 300s). La UI ya tiene sección objetivo en `mockups/dashboard-admin.html:225-264` (Solicitudes de Aprobación). Es lo que el admin ve después de loguearse; sin esto, REQ-03 no cierra el ciclo.

## Mockups de referencia

- `mockups/dashboard-admin.html:225-264` — sección "Solicitudes de Aprobación" con tabla de pendientes, columnas Usuario/Oficio Solicitado/Documentos/Fecha/Acción. Esta HU expone los datos; REQ-13 integra el componente en el dashboard.

## Alternativas consideradas

### Opcion A — Listado paginado con cursor opaco + preview con URL firmada GET
- Cursor = base64(`created_at:id`) de la última fila vista; query usa `(created_at, id) < (cursor.created_at, cursor.id)`.
- Preview URL: `signGetUrl(key, 300)` con la `r2_key` del documento.
- Pro: cursor estable ante inserts concurrentes (a diferencia de offset).
- Pro: TTL 5min minimiza ventana si URL se filtra.

### Opcion B — Offset pagination
- Pro: simple.
- Contra: si entra una solicitud nueva entre páginas, el admin puede ver duplicados o saltarse items.

### Opcion C — Stream continuo sin paginación
- Contra: el admin puede tener 500+ solicitudes; el payload sería enorme.

## Decision

Se elige **Opcion A**. El cursor opaco es estable, el TTL corto minimiza exposición, y la paginación es necesaria para escalar. La URL firmada GET se genera on-demand en cada `preview` request — no se cachea — para que expiraciones sean efectivas.

## Riesgos y mitigaciones

- Riesgo: admin rol spoofeado → Mitigación: middleware valida `locals.user.role === 'admin'` en TODA ruta `/api/v1/admin/*`; un usuario con rol `vecino` o `prestador` recibe 403.
- Riesgo: cursor manipulado para acceder a datos fuera de scope → Mitigación: el cursor sólo codifica `created_at` + `id`; el resultado se filtra por `status='pendiente'` en el WHERE; no hay inyección.
- Riesgo: preview URL pre-firmada reutilizada tras expirar → Mitigación: TTL 300s; tras ese tiempo R2/MinIO responde 403/SignatureDoesNotMatch.

## Metrica de exito

- GET `/admin/verifications?status=pendiente&limit=10` con sesión admin → 200 con `{ items: [...10], cursor }`.
- GET mismo endpoint sin sesión admin (vecino/prestador) → 403.
- GET `/admin/verifications/:id/documents/:docId/preview` → 200 con `{ preview_url, expires_in: 300 }`; URL funcional por 5 min.
- Tests unit + integración + E2E verde; coverage ≥ 90% en `src/lib/services/admin/verifications.ts`.
