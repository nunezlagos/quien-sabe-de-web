# Propuesta — HU-22.3 — Export de datos del titular en JSON

**Estado:** propuesta | **REQ padre:** REQ-22-compliance-ley-19628

## Contexto

El Art. 12 de la Ley 19.628 (derecho de acceso) garantiza que el titular puede solicitar copia de sus datos personales. Hoy la plataforma no expone ninguna forma de obtenerlos en formato portable. Esta HU implementa `GET /api/v1/users/me/data-export` que devuelve un JSON con todas las tablas relevantes para el usuario (perfil, reseñas dejadas, favoritos, contactos, consentimientos), respeta rate-limit de 1 por día y deja huella en `data_access_log` para auditoría. La descarga vía ZIP/R2 queda como follow-up menor (no es requerida para cumplir Art. 12).

## Mockups de referencia

Sin mockup directo (HU backend). La sección "Mis datos" en `mockups/dashboard-user.html:71` es el destino visual del botón que dispara este endpoint (futuro REQ-22 task).

## Alternativas consideradas

### Opción A — JSON directo con `Content-Disposition: attachment`
- El handler responde 200 con `application/json` y `attachment; filename="quien-sabe-data-{userId}-{date}.json"`.
- Pro: implementación trivial; cumple Art. 12 sin más.
- Pro: el browser dispara descarga directa sin UI adicional.
- Contra: si el JSON pesa mucho, el browser tarda; mitigable con paginación interna o streaming.

### Opción B — ZIP en R2 con link temporal
- Pro: permite incluir assets (fotos, certificados) en un bundle.
- Contra: requiere bucket R2 (binding ya disponible), lifecycle del link temporal y async job; sale del scope MVP.

### Opción C — Streaming NDJSON
- Pro: tamaño ilimitado.
- Contra: el navegador no descarga NDJSON nativamente; requiere UI cliente que parsee.

## Decisión

Se elige **Opción A**. JSON directo con attachment es la implementación canónica del derecho de acceso y la que la mayoría de los titulares esperan. ZIP queda como mejora futura (REQ aparte).

## Riesgos y mitigaciones

- Riesgo: el JSON incluye IDs de otros usuarios (ej. en reseñas recibidas por un prestador) → Mitigación: las claves con PII de terceros se anonimizan (ver diseño). Sólo se preserva `provider_public_slug` para favoritos.
- Riesgo: rate-limit sin usar KV persistente falla en múltiples instancias → Mitigación: usar binding KV (ya disponible) con TTL de 86400s.
- Riesgo: el JSON contiene contraseñas hasheadas o tokens internos → Mitigación: whitelist explícita de columnas serializables; documentar.

## Métrica de éxito

- `GET /api/v1/users/me/data-export` con sesión devuelve 200 + JSON con claves `user`, `provider_profile`, `reviews_left`, `favorites`, `contacts`, `consents`.
- Segunda request dentro de 24h → 429.
- Filas en `data_access_log` (HU-22.6) con `actor=self, action='data_export'`.
- Sabotaje: olvidar el rate-limit → segunda request misma hora devuelve 200 → restaurar.