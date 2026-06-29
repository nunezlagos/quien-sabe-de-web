# Propuesta — HU-22.5 — Consentimiento granular por finalidad

**Estado:** propuesta | **REQ padre:** REQ-22-compliance-ley-19628

## Contexto

El cookie banner (HU-22.1) captura la primera decisión del visitante, pero la Ley 19.628 obliga a permitir al titular modificar su consentimiento en cualquier momento y para finalidades específicas. Esta HU entrega el endpoint `PATCH /api/v1/users/me/consent` para que un usuario logueado pueda togglear comunicaciones (marketing), analytics (REQ-18) y perfil público (visibilidad en búsqueda), con historial append-only en `user_consents` para auditoría y prueba de cumplimiento.

## Mockups de referencia

- `mockups/dashboard-user.html:71` — card "Vecinos Guardados" donde se insertará la sección "Mis consentimientos" (futuro, fuera de scope inmediato).
- `mockups/about.html:78` — patrón de badge "Más Popular" `bg-accent text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider` reutilizable para toggles activos.

## Alternativas consideradas

### Opción A — Tabla append-only `user_consents` + middleware `consentRequired`
- Tabla `user_consents(id, user_id, purpose, granted, granted_at)`. Cada cambio inserta nueva fila; nunca UPDATE ni DELETE.
- Middleware `consentRequired('public_profile')` bloquea acciones que requieren consentimiento activo.
- Pro: trazabilidad completa (cuándo cambió qué); cumple con el principio de responsabilidad proactiva.
- Pro: append-only permite reconstruír el historial para audit.
- Contra: la tabla crece linealmente con los cambios; aceptable porque cada user hace pocos cambios al año.

### Opción B — Columna única `users.consents` JSON
- Pro: una sola fila por user.
- Contra: pierde historial; el titular no puede probar que consintió en una fecha específica.

### Opción C — Tabla mutable con última versión
- Pro: indexable por `(user_id, purpose)`.
- Contra: igual que B, sin historial.

## Decisión

Se elige **Opción A**. La tabla append-only es el patrón estándar de compliance (similar a "consent log" en GDPR). El historial es evidencia invaluable ante una eventual fiscalización de la Agencia de Protección de Datos.

## Riesgos y mitigaciones

- Riesgo: cambio de `public_profile = false` rompe el filtro de búsqueda → Mitigación: REQ-06 (buscador) debe agregar `AND (users.public_profile_consent = true OR providers.user_id = self)` al query. Coordinar con HU-06.
- Riesgo: emails transaccionales (verificación, password reset) son bloqueados por `communications = false` → Mitigación: el helper de envío distingue `transactional` (siempre envía) vs `marketing` (consulta consent). Documentar.
- Riesgo: el middleware `consentRequired` añade latencia a cada request → Mitigación: lookup en `users.public_profile_consent` (columna derivada del último row) cacheada 60s en KV. Aceptable para MVP.

## Métrica de éxito

- PATCH con `{communications: false}` → 200 + nueva fila en `user_consents` con `purpose='communications', granted=0`.
- `communications=false` → próximo email de marketing no se envía (verificable con mock de provider de email).
- `public_profile=false` → `/p/:slug` del prestador devuelve 404.
- `analytics=false` → endpoint REQ-18 retorna 204 sin registrar evento.
- Sabotaje: hacer UPDATE en vez de INSERT en `user_consents` → el historial queda con una sola fila → test verifica que hay 2 filas tras 2 toggles → restaurar.