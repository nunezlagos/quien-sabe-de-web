# REQ-22-compliance-ley-19628

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Cumplimiento de la Ley 19.628 sobre Protección de la Vida Privada (Chile):
cookie banner, página de privacidad detallada, export de datos, derecho al
borrado, consentimiento granular y auditoría de accesos administrativos a
datos personales.

## Criterios de éxito

- [ ] Cookie banner aparece en primera visita y persiste decisión en
      localStorage + cookie firmada.
- [ ] Página `/privacy` cubre Art. 12 y 13 de la Ley 19.628.
- [ ] Usuario puede exportar TODOS sus datos en JSON desde dashboard.
- [ ] Usuario puede eliminar cuenta (soft delete + anonimización).
- [ ] Consentimiento por finalidad: comunicaciones, analytics, perfil público.
- [ ] Cada acceso admin a datos personales queda registrado.

## UI pendiente

Mockup parcial. `mockups/terms.html` existe como base. Falta diseñar:

- Cookie banner: sticky-bottom, estilo de los cards `bg-white shadow-sm
  border border-gray-100` con tres botones (Aceptar todo / Sólo necesarias
  / Configurar). Reutilizar paleta de `mockups/about.html`.
- `/privacy`: layout idéntico a `mockups/terms.html` con secciones nuevas.
- Sección "Mis datos" en `dashboard-user.html` (insertar bajo bloque
  Vecinos Guardados línea 71): botones "Exportar datos" y "Eliminar cuenta".

## Superficie técnica

### Endpoints API
- `GET    /api/v1/users/me/data-export` — ZIP/JSON [sesión]
- `DELETE /api/v1/users/me` — soft delete + anonimiza [sesión]
- `PATCH  /api/v1/users/me/consent` — toggles granulares [sesión]
- `POST   /api/v1/consent/cookies` — registra elección de banner [público]

### Vistas Astro
- `/privacy`, sección "Mis datos" en `/dashboard-user`.

### Tablas Drizzle
- `user_consents` (user_id, purpose, granted, granted_at).
- `data_access_log` (id, admin_id, user_id, accessed_at, reason).
- `users.deleted_at`, `users.anonymized_at`.

### Bindings Cloudflare
- `D1`, `R2` (export ZIP).

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-22.1 | cookie-banner | UI sticky + persistencia | P0 |
| HU-22.2 | pagina-privacidad-ley-19628 | Página `/privacy` | P0 |
| HU-22.3 | endpoint-export-datos-titular | Export JSON | P0 |
| HU-22.4 | endpoint-eliminar-cuenta | Soft delete + anonimización reseñas | P0 |
| HU-22.5 | consentimiento-granular | Toggles por finalidad | P1 |
| HU-22.6 | auditoria-acceso-datos | Middleware admin que logea acceso | P1 |

## Tests requeridos

- **Unit:** Zod del consentimiento, serializador export.
- **Integración:** export contiene todas las tablas relevantes; delete
  anonimiza reseñas (autor → "Vecino eliminado") pero las preserva.
- **E2E:** vecino acepta cookies → cambia consent → exporta → borra cuenta.

## Dependencias

- **Depende de:** REQ-01, REQ-02, REQ-09, REQ-16
- **Habilita a:** —

## Riesgos / suposiciones

- Reseñas no se borran físicamente para preservar integridad de la
  reputación del prestador; autor se anonimiza.
- Export incluye datos derivados (reseñas dejadas, contactos efectuados).
