# Propuesta — HU-02.3 — Preferencias de notificación e intereses

**Estado:** propuesta | **REQ padre:** REQ-02-onboarding-vecino

## Contexto

Un vecino con perfil completo quiere ajustar qué notificaciones recibe y qué oficios le interesan (para personalizar la búsqueda y el mailing). Esta HU agrega la tabla `user_preferences` y extiende el endpoint `PATCH /api/v1/users/me/profile` para aceptar `preferences: { notify_email, interests[] }`. Los `interests` son slugs validados contra el catálogo de oficios (tabla `trades` o whitelist). Es P1 porque el MVP puede funcionar con defaults, pero la métrica de engagement depende de segmentar correctamente.

## Mockups de referencia

- No existe mockup para preferencias. **Mockup TBD** — el step 2 del wizard (HU-02.2) lleva los checkboxes de intereses. La vista de edición posterior puede vivir en `/account-data` (mockup `mockups/account-data.html`) cuando REQ-22 lo construya.

## Alternativas consideradas

### Opcion A — Tabla dedicada `user_preferences` 1:1 con `users`
- Tabla `user_preferences(user_id PK, notify_email BOOL, interests JSON, updated_at)`.
- Whitelist de `interests` contra catálogo existente (tabla `trades` cuando exista; placeholder array por ahora).
- Pro: separación limpia; permite queries de "vecinos interesados en X" para mailing segmentado.
- Contra: una tabla más para algo pequeño.

### Opcion B — Columnas JSON en `users`
- Pro: cero migraciones nuevas; un solo row.
- Contra: queries sobre `interests` requieren json_extract; menos portable; futura migración para agregar campos (notify_sms, notify_push) es más invasiva.

### Opcion C — Sin preferencias, todo global
- Contra: bloquea mailing segmentado y rompe engagement; la métrica OE2 asume targeting.

## Decision

Se elige **Opcion A**. La tabla dedicada es la base para queries de segmentación que REQ-17 (notificaciones) y REQ-09 (reseñas) van a necesitar. El whitelist contra catálogo permite detectar typos y mantener integridad referencial conceptual.

## Riesgos y mitigaciones

- Riesgo: `interests` como JSON sin validar → Mitigación: Zod refine consulta catálogo `trades` (o whitelist hardcoded hasta que exista tabla) y rechaza slugs inválidos con 422.
- Riesgo: PATCH sobrescribe `interests` completo, perdiendo valores no enviados → Mitigación: el endpoint implementa merge a nivel servicio (PATCH parcial = merge de keys; para arrays, union no destructiva salvo `interestsReplace: true`).
- Riesgo: `notify_email: false` impacta emails transaccionales (verificación, recuperación) → Mitigación: documentar que `notify_email` controla SOLO emails de marketing/segmentados; los transaccionales (REQ-17) se envían siempre.

## Metrica de exito

- PATCH inicial crea fila en `user_preferences` con los valores enviados.
- PATCH posterior con sólo `notify_email` actualiza ese campo y conserva `interests`.
- PATCH con `interests: ["oficio-inexistente"]` → 422 con detalle del slug inválido.
- Tests unit + integración + E2E verde; coverage ≥ 90% en `src/lib/services/onboarding.ts` y `src/lib/validators/preferences.ts`.
