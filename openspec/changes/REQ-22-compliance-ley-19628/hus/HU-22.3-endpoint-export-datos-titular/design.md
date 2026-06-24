# Diseño técnico — HU-22.3 — Export de datos del titular en JSON

**REQ padre:** REQ-22-compliance-ley-19628

## Modelo de datos

No introduce tablas. Lee de: `users`, `providers`, `provider_communes`, `reviews`, `favorites`, `contact_events`, `user_consents` (cuando HU-22.5 exista). La tabla `data_access_log` la introduce HU-22.6.

## Contrato de API

| Endpoint | Método | Auth | Response 200 | Errores |
|---|---|---|---|---|
| `/api/v1/users/me/data-export` | GET | sesión | `application/json; Content-Disposition: attachment; filename="qs-data-{userId}-{YYYY-MM-DD}.json"` con payload `UserDataExport` | 401 (sin sesión), 429 (rate-limit 24h) |

Shape de respuesta:
```ts
interface UserDataExport {
  exported_at: string  // ISO timestamp
  user: {
    id: number
    email_hash: string  // SHA-256 del email; NO el email plano
    display_name: string
    created_at: string
    deleted_at: string | null
  }
  provider_profile: null | {
    id: number
    display_name: string
    bio: string | null
    whatsapp: string
    base_price_clp: number
    status: string
    communes: Array<{id, name, slug}>
  }
  reviews_left: Array<{ id, provider_id, rating, comment, created_at }>
  favorites: Array<{ id, provider_public_slug, created_at }>
  contacts: Array<{ id, provider_id, kind, created_at }>  // sin ip_hash ni ua_hash
  consents: Array<{ purpose, granted, granted_at }>
}
```

## Validaciones Zod

```ts
// src/lib/validators/compliance/export.ts
export const dataExportResponseSchema = z.object({
  exported_at: z.string().datetime(),
  user: z.object({ id: z.number(), email_hash: z.string().length(64), display_name: z.string(), created_at: z.string(), deleted_at: z.string().nullable() }),
  provider_profile: z.union([z.object({ /* ... */ }), z.null()]),
  reviews_left: z.array(/* ... */),
  favorites: z.array(/* ... */),
  contacts: z.array(/* ... */),
  consents: z.array(/* ... */),
})
```

(Usado en tests para validar el shape.)

## Componentes UI

No aplica. Esta HU es backend puro.

## Flujo de interacción (secuencial)

1. Usuario autenticado hace `GET /api/v1/users/me/data-export`.
2. Middleware `requireSession` → 401 sin sesión.
3. Service `getDataExport(env, userId)`:
   - Query 1: `SELECT * FROM users WHERE id = ?` (devuelve fila completa; el helper anonimiza `email` → `email_hash`).
   - Query 2: `SELECT p.*, json_group_array(json_object('id', c.id, 'name', c.name, 'slug', c.slug)) as communes FROM providers p LEFT JOIN provider_communes pc ON pc.provider_id = p.id LEFT JOIN communes c ON c.id = pc.commune_id WHERE p.user_id = ? GROUP BY p.id`.
   - Query 3-6: SELECT de reviews, favorites, contact_events, user_consents.
   - Devuelve `UserDataExport`.
4. Rate-limit: `await env.SESSION_KV.get('data_export:<userId>')`; si existe → 429.
5. Audit: insertar en `data_access_log` con `actor=self, action='data_export'` (HU-22.6).
6. Set rate-limit: `await env.SESSION_KV.put('data_export:<userId>', '1', { expirationTtl: 86400 })`.
7. Responde 200 con JSON + `Content-Disposition: attachment`.

## Capa de servicios

- `src/lib/services/compliance/export.ts`:
  - `getUserDataExport(env, userId): Promise<UserDataExport>`.
  - Internamente usa Drizzle queries parametrizadas.
  - Helper `hashEmail(email)` con SHA-256 (mismo helper que `contact_events.ipHash` en HU-08.1).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/export.test.ts` — `getUserDataExport` con mock DB: usuario sin provider → `provider_profile = null`; reseñas dejadas en orden cronológico; favoritos con `provider_public_slug` (no ID); contactos sin `ip_hash`. |
| Integración | `tests/integration/compliance/export.test.ts` — fixture user con provider + 2 reseñas + 1 favorito + 1 contacto: GET devuelve JSON con las 6 claves y conteos correctos; segunda GET en misma hora devuelve 429; tras `await new Promise(r => setTimeout(r, 1000))` y manipulación de KV TTL → 200. Verifica fila en `data_access_log`. |
| E2E | `tests/e2e/data-export.spec.ts` (opcional) — login user → click "Exportar datos" en `/dashboard-user` → descarga `qs-data-1-2026-06-18.json`. |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01 (sesión), REQ-04 (tabla `providers`), REQ-09 (reseñas), REQ-22.6 (`data_access_log`), REQ-28 (favoritos).
- **Bloquea a:** ninguna HU directa.
- **Recursos compartidos:** KV binding `SESSION`, D1 binding.

## Riesgos técnicos

- Riesgo: el JSON pesa > 1MB con muchos contactos → Mitigación: paginación interna si supera 5MB (no esperado en MVP); documentar.
- Riesgo: race condition en el rate-limit (doble GET simultáneo) → Mitigación: usar `put` con `expirationTtl` es atómico; si dos requests pasan, ambos ven null y ambos insertan audit. Aceptable.
- Riesgo: helper `hashEmail` no es reversible (es hash) → Mitigación: cumple el principio de minimización; el titular no recibe su email en plaintext, pero sí puede solicitar el cambio de email. Documentar.