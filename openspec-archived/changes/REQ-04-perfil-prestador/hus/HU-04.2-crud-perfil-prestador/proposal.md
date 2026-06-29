# Propuesta — HU-04.2 — CRUD del perfil de prestador con Zod

**Estado:** propuesta | **REQ padre:** REQ-04-perfil-prestador

## Contexto

Una vez que `providers` existe (HU-04.1), el prestador autenticado
necesita endpoints para crear su perfil, editarlo, verlo y
desactivarlo. La HU define el contrato HTTP y la validación de entrada;
no incluye subida de archivos (eso vive en HU-04.3) ni publicación
desde preview (HU-04.4). El perfil debe ser **soft-delete** porque
reseñas (REQ-09) y contactos (REQ-08) referencian al prestador y la
auditoría no puede romper esos FKs.

## Mockups de referencia

- `mockups/dashboard-provider.html:97-195` — formulario "Editar Perfil" del dashboard del prestador (nombre, oficio, bio, galería). Los endpoints `PATCH /api/v1/providers/me` reflejan este formulario.
- `mockups/dashboard-provider.html:198-225` — sección "Mis Servicios Activos" con precio `$15.000`, `$25.000` (referencia visual para `price_clp`).
- `mockups/create-trade.html:50-100` — formulario de alta con campos `Oficio`, `WhatsApp`, `Precio Base`, `Descripción Corta`. La lógica de `POST /api/v1/providers/me` se alinea con este formulario.

## Alternativas consideradas

### Opcion A — Endpoints separados `POST/PATCH/DELETE/GET /api/v1/providers/me` con Zod
- Un solo archivo `src/pages/api/v1/providers/me/index.ts` que rutea por método.
- Pro: convención REST clara, una URL estable `/me` que representa "perfil propio".
- Pro: el `UNIQUE(user_id)` de HU-04.1 ya garantiza el "una cuenta = un perfil", así que no hace falta `:id` en la URL.
- Contra: si el prestador quiere operar sobre un servicio, va a otro archivo (`/services`), pero la convención se mantiene.

### Opcion B — RPC-style `/api/v1/provider-actions?action=create|update|delete`
- Un solo endpoint que dispatcha según query param.
- Pro: archivo único, menos boilerplate.
- Contra: rompe el modelo mental REST y el versionado de OpenAPI; los códigos de error específicos por operación son más difíciles de testear.

### Opcion C — Endpoints con `:providerId` explícito + verificación de ownership en middleware
- `PATCH /api/v1/providers/:id` con guard middleware que compara `session.userId` con `provider.userId`.
- Pro: simétrico con admin (REQ-13) que sí va a usar `:id`.
- Contra: añade superficie de ataque (path traversal a IDs ajenos), los criterios 403 se manejan más explícitamente con `/me` y `Astro.locals.session`.

## Decision

Se elige **Opcion A**. `/api/v1/providers/me` es la convención más limpia
para "perfil propio" y elimina el riesgo del escenario "intentar editar
perfil ajeno → 403": si el handler siempre opera sobre el
`Astro.locals.session.userId`, no hay forma de apuntar a un perfil
ajeno. El 403 desaparece como caso posible (en su lugar, el handler
devuelve 404 si no hay perfil propio). Se mantiene Zod como única fuente
de verdad para validación y sanitización.

## Riesgos y mitigaciones

- Riesgo: HTML malicioso en `description` → Mitigación: sanitización con `DOMPurify-server` antes de persistir (configurado en T2).
- Riesgo: teléfono/WhatsApp con formato libre → Mitigación: regex `^\+?[0-9]{8,15}$` en Zod.
- Riesgo: cambio de `trade_id` sin disparar reindex (HU-04.5) → Mitigación: documentar en design que el handler emite evento; HU-04.5 lo conecta.
- Riesgo: soft-delete deja huérfanas las filas en `contact_events` y `reviews` → Mitigación: FK ya está con `ON DELETE RESTRICT` por defecto para esos recursos; soft-delete (`status='deleted'`) no borra la fila físicamente, sólo cambia el campo.

## Metrica de exito

- `POST /api/v1/providers/me` con body válido devuelve 201; segundo POST devuelve 409.
- `PATCH /api/v1/providers/me` con `{"hourly_rate_clp": 30000}` actualiza la fila y devuelve 200 con el cuerpo actualizado.
- `DELETE /api/v1/providers/me` devuelve 204; la fila sigue existiendo con `status='deleted'`.
- `description` con `<script>alert(1)</script>` se persiste sin la etiqueta `script` (sanitizado).
