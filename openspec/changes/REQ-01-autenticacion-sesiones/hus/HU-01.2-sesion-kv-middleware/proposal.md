# Propuesta — HU-01.2 — Sesión en KV + middleware global con Astro.locals.user

**Estado:** propuesta | **REQ padre:** REQ-01-autenticacion-sesiones

## Contexto

REQ-01 necesita que el resto del sistema lea `Astro.locals.user` sin re-consultar la base. Esta HU define el contrato de sesión: token opaco en cookie + entrada en Cloudflare KV con `user_id`, `role`, `exp`; middleware global que hidrata `locals.user`; TTL configurable por env. Es el corazón de la autenticación: sin esto, `/auth/me`, dashboards y rutas protegidas no funcionan.

## Mockups de referencia

- No existe mockup directo. El contrato es interno (backend + tipos). Las vistas que consumen `locals.user` se diseñan en:
  - `mockups/dashboard-user.html:1-50` — header con avatar/nombre del vecino.
  - `mockups/dashboard-provider.html:1-50` — header con menú prestador.
  - **Mockup TBD** para `/login` y `/register` (cubierto en HU-01.1).

## Alternativas consideradas

### Opcion A — Token opaco en KV, cookie HttpOnly, middleware global
- Token random de 32 bytes (hex 64 chars) escrito en `SESSION` binding con TTL `SESSION_TTL_DAYS` (default 14).
- Cookie solo guarda el token; los datos del usuario viven en KV.
- Pro: cookie pequeña, revocación inmediata (borrar la key), soporta ban en tiempo real.
- Pro: KV con TTL evita limpieza manual.
- Contra: KV tiene consistencia eventual — `get` justo después de `put` puede devolver stale; mitigable leyendo D1 como fallback.

### Opcion B — JWT firmado (HS256/RS256) sin KV
- Pro: stateless, sin latencia de KV.
- Contra: revocación requiere denylist (que vuelve a necesitar KV); payload visible al cliente; secret rotation es costosa.

### Opcion C — Sesión server-side en D1 con cookie de session_id
- Pro: una sola tecnología (D1).
- Contra: lectura extra a DB en cada request autenticado, peor latencia y carga que KV para tokens opacos hot-path.

## Decision

Se elige **Opcion A**. KV es la herramienta correcta para lookups de baja latencia, alta cardinalidad y TTL nativo. El middleware global unifica el flujo: cualquier ruta (page o API) que lea `locals.user` recibe el snapshot hidratado. TTL configurable por env cubre el caso "admin quiere acortar sesiones por incidente" sin redeploy.

## Riesgos y mitigaciones

- Riesgo: KV consistency window invalida una sesión recién creada en otro edge → Mitigación: el endpoint de login setea la cookie y la key antes de devolver; la primera lectura ocurre en el mismo datacenter.
- Riesgo: `Astro.locals.user` queda con snapshot desactualizado (ej. role cambiado en DB) → Mitigación: snapshot vive lo que dura el request; rutas críticas (HU-01.6 `/me`) re-leen DB.
- Riesgo: middleware añade latencia a cada request → Mitigación: KV get tipicamente <10ms; si la cookie no existe, el middleware retorna sin tocar KV.

## Metrica de exito

- Login crea key `session:<token>` en KV con TTL exacto a `SESSION_TTL_DAYS*86400`.
- Request con cookie válida → `Astro.locals.user` poblado antes de que el handler se ejecute (verificable con log o test).
- Cookie con token inexistente → `Astro.locals.user === undefined`, request continúa, handler decide 401/403.
- Token expirado → middleware borra cookie (Set-Cookie Max-Age=0) y la respuesta a rutas protegidas es 401.
