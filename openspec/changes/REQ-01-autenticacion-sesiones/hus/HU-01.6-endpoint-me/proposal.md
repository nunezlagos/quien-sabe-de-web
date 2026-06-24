# Propuesta — HU-01.6 — GET /auth/me para hidratar el cliente

**Estado:** propuesta | **REQ padre:** REQ-01-autenticacion-sesiones

## Contexto

El frontend (Astro pages + JS islands) necesita saber si hay sesión activa y, si la hay, quién es el usuario, sin re-consultar `/api/v1/users/me/profile` u otros endpoints. Esta HU define `GET /api/v1/auth/me`: reusa el middleware de HU-01.2 para tener `locals.user` listo, valida que el usuario no esté baneado, y devuelve un DTO mínimo. Es el endpoint "ping" que hidrata el estado global de auth en el cliente.

## Mockups de referencia

- No existe mockup dedicado a `/me`. Es endpoint JSON. Las vistas que lo consumen se diseñan en:
  - `mockups/dashboard-user.html:1-50` — header con avatar/nombre.
  - `mockups/dashboard-provider.html:1-50` — header con menú prestador.
  - `mockups/profile.html:65-67` — el badge `#profile-verified-badge` se hidrata en función de `verified`, no `me`, pero ambos endpoints comparten el patrón "DTO mínimo + boolean flags".

## Alternativas consideradas

### Opcion A — Endpoint dedicado `GET /api/v1/auth/me` que devuelve DTO mínimo
- Devuelve `{ id, email, role, status }` — sin `passwordHash`, sin `createdAt`, sin PII extra.
- 401 sin sesión, 403 si la cuenta está baneada (con destrucción de sesión).
- Pro: contrato estable; frontend puede cachear la respuesta por N segundos sin miedo a filtración.
- Pro: el chequeo de `banned` vive en un solo lugar (este endpoint), no en cada vista.

### Opcion B — Devolver el usuario completo desde `users`
- Pro: menos endpoints, una sola fuente.
- Contra: leak de `passwordHash` si alguien olvida el `.omit()`; superficie inestable (cada nueva columna en `users` rompe clientes).

### Opcion C — Endpoint "include everything" con ETag
- Pro: menos round-trips para dashboards pesados.
- Contra: sobre-ingeniería para `/me`; los dashboards usan sus endpoints específicos.

## Decision

Se elige **Opcion A**. DTO mínimo + estable. El endpoint sólo valida que la sesión sea "usable" (no expirada, no baneada) y devuelve los 4 campos que el resto del sistema necesita. La destrucción de sesión en el caso `banned` cierra un vector de riesgo: un admin que banea a un usuario invalida el token inmediatamente sin esperar TTL.

## Riesgos y mitigaciones

- Riesgo: DTO crece con el tiempo y rompe clientes → Mitigación: el endpoint devuelve EXACTAMENTE 4 campos. Cualquier nueva info va a `/api/v1/users/me/profile` (REQ-02) u otro endpoint específico.
- Riesgo: el chequeo de `banned` requiere un query extra a DB → Mitigación: el middleware de HU-01.2 ya enriquece `locals.user` con `status` desde DB; este endpoint sólo lee `locals.user.status`. Sin query extra.
- Riesgo: 403 sin destruir sesión deja el token "vivo" hasta TTL → Mitigación: el handler llama `destroySession` antes de responder 403.

## Metrica de exito

- `GET /api/v1/auth/me` con sesión activa → 200 `{ id, email, role, status }` sin `passwordHash`.
- `GET /api/v1/auth/me` sin cookie → 401 `no autenticado`.
- `GET /api/v1/auth/me` con sesión banneada → 403 `cuenta deshabilitada` + sesión destruida en KV.
- Tests unit + integración + E2E verde; coverage ≥ 90% en `src/pages/api/v1/auth/me.ts`.
