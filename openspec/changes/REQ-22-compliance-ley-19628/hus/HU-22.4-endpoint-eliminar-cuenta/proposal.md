# Propuesta — HU-22.4 — Eliminar cuenta con soft delete y anonimización

**Estado:** propuesta | **REQ padre:** REQ-22-compliance-ley-19628

## Contexto

El Art. 12 de la Ley 19.628 (derecho de cancelación) permite al titular solicitar la eliminación de sus datos. En una plataforma con reseñas, eliminar físicamente las filas rompe la reputación del prestador; la práctica correcta es soft delete + anonimización del autor preservando el contenido. Esta HU implementa `DELETE /api/v1/users/me` con confirmación explícita (`{"confirm":"ELIMINAR"}`), anonimiza `email`, marca `deleted_at` y `anonymized_at`, preserva reseñas con autor "Vecino eliminado", revoca sesiones KV y marca `providers.status="deleted"` si aplica.

## Mockups de referencia

Sin mockup directo (HU backend). La sección "Mis datos" en `mockups/dashboard-user.html:71` expondrá el botón "Eliminar cuenta" que dispara este endpoint.

## Alternativas consideradas

### Opción A — Soft delete + anonimización en transacción D1 + revocación sesiones
- `users.deleted_at = NOW()`, `users.anonymized_at = NOW()`, `users.email = 'deleted-<uuid>@quien-sabe.local'`.
- `reviews.user_id_display = 'Vecino eliminado'` (nueva columna, ver diseño) preservando `reviews.user_id` apuntando al user original (referencia débil).
- `providers.status = 'deleted'` (ya cubierto por REQ-04 enum).
- `await revokeAllSessions(userId)` reusando helper de HU-19.4.
- Pro: integridad referencial intacta, datos derivados (reputación) preservados, derecho del titular cumplido.
- Contra: requiere agregar columna `user_id_display` a `reviews`.

### Opción B — Hard delete en cascada
- Pro: técnicamente más simple.
- Contra: borra reseñas recibidas, lo que el prestador pierde reputación no ganada por él. Viola equilibrio entre derechos del titular e interés legítimo del prestador. No recomendado por doctrina de protección de datos.

### Opción C — Anonimización diferida (grace period 30 días)
- Pro: usuario puede arrepentirse.
- Contra: la Ley 19.628 exige cumplimiento inmediato del derecho de cancelación; un grace period sin base legal es riesgoso.

## Decisión

Se elige **Opción A**. Es el patrón estándar de "right to be forgotten" en plataformas con contenido generado por terceros. La columna nueva `reviews.user_id_display` es el cambio de schema mínimo necesario; la integridad se preserva vía `reviews.user_id` que sigue apuntando al user original (anonimizado).

## Riesgos y mitigaciones

- Riesgo: confirmación débil (`{"confirm":"ELIMINAR"}` typo) → Mitigación: validación Zod exige string exacto `ELIMINAR` (case-sensitive).
- Riesgo: la anonimización deja columnas con PII residual (display_name, bio, whatsapp) → Mitigación: estas columnas se setan a `null` o a literales genéricos en la misma transacción.
- Riesgo: el soft delete rompe queries que filtran `users.deleted_at IS NULL` → Mitigación: REQ-04 (auth) ya debe filtrar por `deleted_at IS NULL`; auditar todas las queries existentes con un grep.

## Métrica de éxito

- DELETE con `confirm: "ELIMINAR"` → 204.
- `users.email` después del delete: `deleted-<uuid>@quien-sabe.local` (formato exacto).
- `users.deleted_at` y `users.anonymized_at` con timestamps.
- `reviews` del user mantienen contenido pero `user_id_display = "Vecino eliminado"`.
- Sesiones KV del user ya no autentican (`requireSession` falla).
- DELETE sin confirm → 422.
- Sabotaje: olvidar `revokeAllSessions` → user puede seguir navegando con sesión vieja → test verifica que nueva request con sesión vieja devuelve 401 → restaurar.