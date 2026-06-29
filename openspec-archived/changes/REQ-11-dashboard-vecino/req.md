# REQ-11-dashboard-vecino

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Panel privado del rol vecino. Vista resumen con historial de contactos
hechos, reseñas dejadas, perfil propio editable y atajo para iniciar nueva
búsqueda. Es el aterrizaje post-login del vecino.

## Criterios de éxito

- [ ] Tras login del vecino, redirect automático a `/dashboard-user`.
- [ ] Historial de contactos paginado con link al perfil contactado.
- [ ] Listado de reseñas dejadas (con link a edición si dentro de ventana).
- [ ] Edición de perfil propio (foto, comuna, preferencias).
- [ ] Botón "buscar nuevo servicio" lleva a home con foco en buscador.

## Superficie técnica

### Endpoints API
- `GET   /api/v1/users/me/contacts` — historial paginado [sesión vecino]
- `GET   /api/v1/users/me/reviews` — reseñas dejadas [sesión vecino]
- (Reuso de) `PATCH /api/v1/users/me/profile` — editar perfil

### Vistas Astro
- `/dashboard-user`

### Tablas Drizzle
- Lectura de `contact_events`, `reviews`, `users`

### Bindings Cloudflare
- `D1`

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-11.1 | layout-dashboard-vecino | Layout + tabs + perfil cabecera | P0 |
| HU-11.2 | historial-contactos | Listado paginado + link | P0 |
| HU-11.3 | mis-resenas | Listado con CTA editar (si aplica) | P0 |
| HU-11.4 | editar-perfil-modal | Modal de edición | P1 |

## Tests requeridos

- **Unit:** formateadores de fecha relativa, helper "puede editar reseña".
- **Integración:** endpoints retornan sólo del usuario en sesión (no leak cross-user).
- **E2E:** login vecino → ve historial → edita perfil → cambios persisten al recargar.

## Dependencias

- **Depende de:** REQ-02, REQ-08, REQ-09
- **Habilita a:** —

## Riesgos / suposiciones

- Privacidad estricta: nunca exponer contactos de otros vecinos al admin sin orden.
