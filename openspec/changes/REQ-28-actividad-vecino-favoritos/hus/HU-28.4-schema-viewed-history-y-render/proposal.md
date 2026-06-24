# Propuesta — HU-28.4 — Schema user_views + sección Recientes

**Estado:** propuesta | **REQ padre:** REQ-28-actividad-vecino-favoritos

## Contexto

El vecino debe poder retomar fácilmente prestadores que vio
recientemente sin tener que buscarlos de nuevo. Esta HU añade el
historial `user_views`, lo dedupea < 1h por par usando KV para evitar
spamear escrituras, y lo renderiza en la sección "Recientes" del
dashboard. Refuerza OE2 (fidelización del vecino) y cierra el REQ-28.

## Mockups de referencia

- `mockups/dashboard-user.html:100-112` — sección "Recientes" completa.
  Contenedor `bg-white rounded-3xl shadow-sm border border-gray-100 p-6`,
  header con `ri-history-line text-gray-400` y título "Recientes".
- `mockups/dashboard-user.html:103-106` — primer item (búsqueda): icono
  `ri-search-line bg-gray-100 p-1.5 rounded-lg` + texto.
- `mockups/dashboard-user.html:107-110` — segundo item (perfil): icono
  `ri-user-line bg-gray-100 p-1.5 rounded-lg` + texto "Perfil de Pedro
  Tapia".
- `mockups/profile.html:60-104` — la página de perfil que dispara el
  side-effect `POST /api/v1/providers/:id/views` cuando el vecino
  logueado la visita.

## Alternativas consideradas

### Opción A — Tabla `user_views` con dedupe en KV TTL 1h
- Tabla `(user_id, provider_id, viewed_at)` con índice
  `(user_id, viewed_at DESC)`. Antes de cada insert, consulta KV
  `view_dedupe:<userId>:<providerId>`; si existe, skip; si no,
  inserta y set KV con TTL 3600 s.
- Pro: lectura cero para deduplicar; inserts en DB controlados; cron
  mensual mantiene tabla acotada (top 50 por usuario).
- Contra: consistencia eventual entre KV y D1 (aceptable: el peor caso
  es una fila duplicada que cae con TRIM).

### Opción B — Dedupe puro en SQL (`WHERE NOT EXISTS ... < 1h`)
- Antes de insertar, consultar `user_views` para ver si hay vista
  reciente.
- Pro: una sola fuente de verdad.
- Contra: cada vista de perfil hace al menos una lectura + un insert a
  D1; en perfiles populares multiplica RTTs.

## Decisión

Opción A. KV está pensado exactamente para este tipo de "huella de
corta vida"; el costo por escritura de KV en CF es bajo y evita
ensuciar D1. La consistencia eventual no afecta el caso de uso (mostrar
recientes con 5 filas).

## Riesgos y mitigaciones

- Riesgo: `user_views` crece sin límite → Mitigación: cron mensual que
  trim a 50 por usuario (ejecutado vía Cloudflare Cron Trigger o tarea
  programada de REQ-26.5).
- Riesgo: visitante anónimo dispara escrituras → Mitigación: el
  endpoint requiere sesión vecino; sin sesión, no-op silencioso.
- Riesgo: KV no disponible localmente → Mitigación: usar binding
  `SESSION` que ya está configurado; en dev con wrangler `platformProxy`
  funciona en memoria.
- Riesgo: registrar la propia vista del prestador en su perfil →
  Mitigación: si `session.user_id === provider.user_id`, no registrar.

## Métrica de éxito

- Visitar el mismo perfil dos veces en 30 min produce una sola fila.
- Sección "Recientes" muestra hasta 5 items, ordenados por fecha
  descendente, con el icono correcto según tipo (`ri-user-line` para
  perfil, `ri-search-line` para búsqueda en futuras extensiones).
- Tras 50+ filas por usuario, el cron mensual deja solo las 50 más
  recientes.
- Coverage ≥ 90 % en el módulo.
