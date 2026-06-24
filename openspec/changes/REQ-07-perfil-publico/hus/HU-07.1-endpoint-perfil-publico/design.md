# Diseno tecnico — HU-07.1 — Endpoint GET de perfil público

**REQ padre:** REQ-07-perfil-publico

## Modelo de datos

Esta HU no introduce tablas. Lee de `providers`, `services`, `reviews` (definidas en REQ-04, REQ-05 y REQ-09 respectivamente).

Consulta compuesta (pseudo SQL sobre D1):

```sql
SELECT
  p.id, p.slug, p.name, p.trade, p.commune_slug, p.description,
  p.photo_r2_key, p.status, p.verified,
  (SELECT AVG(rating) FROM reviews WHERE provider_id = p.id AND status='visible') AS rating_avg,
  (SELECT COUNT(*) FROM reviews WHERE provider_id = p.id AND status='visible') AS reviews_count
FROM providers p
WHERE (p.id = :idOrSlug OR p.slug = :idOrSlug)
  AND p.status != 'deleted'
LIMIT 1;
```

Servicios y contacto se obtienen en queries paralelas:

```sql
-- servicios ordenados por `order` ASC, sólo activos
SELECT id, name, price_clp, description
FROM services
WHERE provider_id = :pid AND status = 'active'
ORDER BY "order" ASC;
```

## Contrato de API

| Endpoint | Método | Auth | Path param | Query | Response 200 | Errores |
|---|---|---|---|---|---|---|
| `/api/v1/providers/:idOrSlug` | GET | público (sin sesión) | id numérico o slug | — | `PublicProvider` | 404 (no existe / soft-deleted) |

DTO `PublicProvider` (TypeScript):

```ts
export type PublicProvider = {
  id: number;
  slug: string | null;
  name: string;
  trade: string;            // "Gasfiter"
  commune: string;          // "Las Condes"
  description: string | null;
  photoUrl: string | null;  // URL firmada R2 o null
  verified: boolean;
  ratingAvg: number | null; // null si no hay reseñas
  reviewsCount: number;
  services: PublicService[]; // length 0..N
  contact: {
    whatsappMasked: string | null; // "+56 9 **** 1234"
    phoneMasked: string | null;
    emailMasked: string | null;
  };
};

export type PublicService = {
  id: number;
  name: string;
  priceClp: number | null; // null → "Consultar" en UI
};
```

Comportamiento:

- `idOrSlug` numérico (`/^\d+$/`) → match por `id`. Otro → match por `slug`.
- `status='deleted'` se trata como inexistente → 404.
- `verified` se calcula leyendo el flag de REQ-03 (o se almacena como denormalización en `providers` — se decide en el PR).

## Validaciones Zod

```ts
// src/lib/validators/providers.ts (firmas)
export const publicProviderDTOSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().nullable(),
  name: z.string().min(1),
  trade: z.string(),
  commune: z.string(),
  description: z.string().nullable(),
  photoUrl: z.string().url().nullable(),
  verified: z.boolean(),
  ratingAvg: z.number().min(0).max(5).nullable(),
  reviewsCount: z.number().int().nonnegative(),
  services: z.array(publicServiceSchema),
  contact: z.object({
    whatsappMasked: z.string().nullable(),
    phoneMasked: z.string().nullable(),
    emailMasked: z.string().nullable(),
  }),
});

export const idOrSlugParamSchema = z.string().min(1).max(200);
```

## Componentes UI

No aplica. Esta HU es sólo el endpoint. Los componentes Astro que consumen este DTO viven en HU-07.2 y siguientes.

## Flujo de interaccion (secuencial)

1. Visitante llega a `/p/<slug>` (renderizado por HU-07.2).
2. La vista Astro hace SSR fetch a `GET /api/v1/providers/<slug>` (mismo origen, internal).
3. Handler en `src/pages/api/v1/providers/[idOrSlug].ts`:
   a. Valida el param con `idOrSlugParamSchema`.
   b. Si matchea `/^\d+$/` → query por `id`; si no → por `slug`.
   c. Filtra `status != 'deleted'`.
   d. Si no hay fila → 404 JSON.
   e. Lanza queries en paralelo: servicios + métricas de reseñas.
   f. Enmascara `phone`, `whatsapp`, `email` con helper `maskContact`.
   g. Devuelve `PublicProvider` con JSON 200.
4. SSR renderiza con el DTO; HU-07.6 añade headers SEO + edge cache.

## Capa de servicios

- `src/lib/services/providers.ts` (nuevo):
  - `getPublicProviderByIdOrSlug(env, idOrSlug): Promise<PublicProvider | null>` — orquestador.
  - `maskContact(value: string | null): string | null` — helper de enmascaramiento.
- `src/lib/services/reviews.ts` (nuevo, stub si no existe):
  - `getProviderRatingStats(env, providerId): Promise<{ avg: number | null, count: number }>` — usado aquí, base para HU-09.5.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/providers.test.ts` | `maskContact` (formato `+56 9 **** 1234`), resolución dual id/slug |
| Unit | `tests/unit/validators/providers.test.ts` | Zod shape, `ratingAvg` 0-5, `reviewsCount` nonneg |
| Integración | `tests/integration/providers/public-get.test.ts` | 200 con DTO completo, 404 id inexistente, 404 slug soft-deleted, sin sesión OK, sin PII cruda en response |

## Dependencias y secuencia

- **Bloqueado por:** REQ-04 (tabla `providers`), REQ-05 (tabla `services`), REQ-09 (tabla `reviews`; al menos el schema mínimo en HU-09.1).
- **Bloquea a:** HU-07.2 (layout), HU-07.3 (servicios), HU-07.4 (reseñas), HU-07.5 (slug/redirect), HU-07.6 (SEO).
- **Recursos compartidos:** binding D1 `Astro.locals.runtime.env.DB`.

## Riesgos tecnicos

- Riesgo: query doble (id vs slug) usa el índice equivocado → Mitigación: `providers.slug` UNIQUE (HU-07.5); para id basta `PRIMARY KEY`.
- Riesgo: `AVG(rating)` con miles de reseñas es lento → Mitigación: índice `idx_reviews_provider_visible (provider_id, status)` en HU-09.1; cache de rating agregado cuando HU-09.5 lo materialice.
- Riesgo: helper de máscara filtra accidentalmente el dato crudo → Mitigación: `maskContact` rechaza strings que no matchean patrón conocido (regex E.164 / email) y devuelve `null` en ese caso.
- Riesgo: SSR re-fetchea el endpoint en cada request → Mitigación: edge cache TTL 60s (HU-07.6).
