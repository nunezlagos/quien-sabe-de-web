# Propuesta — HU-11.1 — Layout del dashboard del vecino

**Estado:** propuesta | **REQ padre:** REQ-11-dashboard-vecino

## Contexto

Tras el login, el vecino necesita un panel privado unificado que centralice tres acciones recurrentes: revisar a quiénes contactó, ver qué reseñas dejó y editar sus datos. Hoy esas acciones están dispersas (perfil público, buscador) y obligan al usuario a navegar "hacia atrás" para volver a un prestador. Este layout es el nuevo "aterrizaje" post-login: la ruta `/dashboard-user` debe convertirse en el destino por defecto cuando el rol es `vecino`, y debe renderizar un shell con header de perfil y tres tabs (Historial, Mis reseñas, Perfil) sobre los que las HU-11.2, HU-11.3 y HU-11.4 montan contenido. La decisión de tener un layout (y no tres páginas separadas) reduce la duplicación visual y permite conservar la pestaña activa al refrescar.

## Mockups de referencia

- `mockups/dashboard-user.html:27-39` — header con saludo, ícono de editar y CTA principal. El header actual del mockup es una "tarjeta de bienvenida"; nosotros lo reemplazamos por un header con avatar + email + tabs debajo, manteniendo el lenguaje visual (rounded-3xl, paleta `primary` verde `#2E8B57`).
- `mockups/dashboard-user.html:148-189` — modal "Editar Mis Datos". La propuesta de tabs adopta ese mismo patrón de modal overlay para la edición de perfil (HU-11.4) en lugar de un tab dedicado.

## Alternativas consideradas

### Opcion A — Una sola ruta `/dashboard-user` con tabs controlados por query string
- Render server-side del shell + contenido de la tab activa hidratado como partial. Persistencia de tab en `?tab=contacts|reviews|profile`.
- Pro: SSR sin JS pesado; consistente con el resto del proyecto (Astro SSR).
- Pro: deep-linkable (`/dashboard-user?tab=reviews`).
- Contra: tab switching sin recarga requiere un script ligero, no una SPA completa.

### Opcion B — Tres rutas separadas `/dashboard-user/{contacts,reviews,profile}`
- Cada ruta es una página Astro independiente con su propio layout.
- Pro: máxima simplicidad por archivo.
- Contra: duplica el header y la nav de tabs; obliga a repetir el guard de sesión en tres páginas; pierde el sentido de "panel único".

### Opcion C — SPA cliente con estado global de tab
- React/Vue mount en `/dashboard-user`, tabs como estado en memoria.
- Pro: UX más fluida.
- Contra: contradice la arquitectura Astro SSR del proyecto; introduce bundle JS innecesario; rompe SSR-first.

## Decision

Se elige **Opcion A**. Una ruta SSR con tab activa persistida en `?tab=` cumple los criterios de aceptación (login redirige, sin sesión → 302 a login, header con tabs) sin introducir dependencias nuevas ni duplicar layout. El pequeño JS necesario para tab switching sin reload se justifica frente al costo de mantener tres rutas.

## Riesgos y mitigaciones

- Riesgo: deep-link a `?tab=profile` con sesión caducada → loop redirect → Mitigación: middleware de sesión corre antes del render y devuelve 302 a `/login?next=/dashboard-user?tab=profile`.
- Riesgo: tab "profile" abierta por defecto en mobile esconde info clave → Mitigación: la primera tab es siempre "Historial", que es la acción más frecuente para un vecino que ya usó el buscador.
- Riesgo: redirect post-login no respeta `?next=` cuando el usuario pidió `/dashboard-admin` → Mitigación: el middleware de post-login distingue rol y rechaza `next` que apunte a `/dashboard-admin` para roles no-admin.

## Metrica de exito

- Login de vecino con credenciales válidas → response 302 a `/dashboard-user` (sin tab en URL).
- GET `/dashboard-user` sin sesión → response 302 a `/login?next=/dashboard-user`.
- E2E Playwright `tests/e2e/dashboard-user-layout.spec.ts`: tres escenarios (login redirige, render con tabs, sin sesión) verdes.
- Vitest integración: middleware bloquea vecinos en `/dashboard-admin` sin afectar `/dashboard-user`.
