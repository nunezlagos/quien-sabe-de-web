# Propuesta — HU-01.5 — Logout limpia sesión KV y cookie

**Estado:** propuesta | **REQ padre:** REQ-01-autenticacion-sesiones

## Contexto

Toda sesión tiene un cierre. Esta HU implementa `POST /api/v1/auth/logout`: destruye la key `session:<token>` en KV y limpia la cookie del cliente. Es el complemento obligatorio de HU-01.1/HU-01.2: sin logout robusto, el token sigue válido hasta su TTL natural aunque el usuario cierre el browser. También cubre los casos degenerados (logout sin sesión, logout con token ya expirado) como idempotentes para no romper UX.

## Mockups de referencia

- No existe mockup dedicado al logout. **Mockup TBD** — el botón "Cerrar sesión" aparece en los headers de `mockups/dashboard-user.html` y `mockups/dashboard-provider.html` (a diseñar en REQ-11 y REQ-12). Esta HU sólo define el endpoint.

## Alternativas consideradas

### Opcion A — Endpoint idempotente que destruye KV + borra cookie
- Lee cookie `session`. Si no hay → 204 sin tocar KV.
- Si hay → `destroySession(env, token)` + `clearSessionCookie(cookies)`.
- Siempre responde 204 (incluso si la key ya no existía).
- Pro: idempotencia real, UX simple, no revela si la sesión estaba viva.
- Pro: cualquier doble-click o retry de red no rompe nada.

### Opcion B — Logout con confirmación (modal "¿estás seguro?")
- Contra: agrega fricción innecesaria; los tokens tienen TTL corto, el daño de un logout accidental es bajo.

### Opcion C — Soft logout (marca invalidated pero no borra)
- Pro: permite "deshacer" logout.
- Contra: el modelo de KV no soporta; requeriría denylist + check on read. Sobre-ingeniería para el caso.

## Decision

Se elige **Opcion A**. Idempotencia es la propiedad clave: el endpoint puede invocarse N veces sin error y sin efectos colaterales. Esto cubre el escenario del botón, del timeout del cliente, y del doble-tap en mobile. `destroySession` ya existe como helper desde HU-01.2.

## Riesgos y mitigaciones

- Riesgo: KV `delete` falla (timeout) y el token sigue válido hasta TTL → Mitigación: aceptar el riesgo (TTL 14d max, no es crítico); loggear error para observabilidad (REQ-18).
- Riesgo: `clearSessionCookie` no setea flags correctos → Mitigación: reusar helper de HU-01.1, ya testeado.
- Riesgo: CSRF en POST `/logout` → Mitigación: el endpoint exige sesión activa, así que el atacante no tiene cookie válida; CSRF sin cookie no aplica. Sumar `Origin`/`Referer` check es defensivo extra.

## Metrica de exito

- Logout con sesión activa → 204, key KV borrada, cookie expirada (Max-Age=0).
- Logout sin cookie → 204, ningún acceso a KV.
- Logout con token expirado/inexistente → 204 + cookie expirada igual.
- Tests unit + integración + E2E verde; coverage ≥ 90% en `src/pages/api/v1/auth/logout.ts`.
