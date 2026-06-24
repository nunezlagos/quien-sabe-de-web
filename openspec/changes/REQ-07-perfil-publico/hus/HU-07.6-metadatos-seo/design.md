# Diseno tecnico — HU-07.6 — Metadatos SEO en perfiles públicos

**REQ padre:** REQ-07-perfil-publico

## Modelo de datos

No introduce tablas. Lee del DTO `PublicProvider` (HU-07.1).

Shape JSON-LD generado (subset):

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Juan Pérez",
  "image": "https://...",
  "description": "...",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Las Condes",
    "addressRegion": "Metropolitana",
    "addressCountry": "CL"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.6,
    "reviewCount": 15
  },
  "url": "https://quien-sabe.cl/p/juan-gasfiter-las-condes",
  "telephone": "+56..."
}
```

## Contrato de API

No añade endpoints. Cambia el output del endpoint HU-07.1 sólo si `photoUrl` cambia de `null` a URL firmada (decisión fuera de scope).

## Validaciones Zod

```ts
// src/lib/validators/seo.ts
export const seoDescriptionSchema = z.string().min(1).max(160);

export const jsonLdSchema = z.object({
  '@context': z.literal('https://schema.org'),
  '@type': z.literal('LocalBusiness'),
  name: z.string(),
  image: z.string().nullable(),
  description: z.string().nullable(),
  address: z.object({
    '@type': z.literal('PostalAddress'),
    addressLocality: z.string(),
    addressRegion: z.string(),
    addressCountry: z.literal('CL'),
  }),
  aggregateRating: z.object({
    '@type': z.literal('AggregateRating'),
    ratingValue: z.number().min(0).max(5).nullable(),
    reviewCount: z.number().int().nonnegative(),
  }).nullable(),
  url: z.string().url(),
  telephone: z.string().nullable(),
});
```

## Componentes UI

### Componentes Astro

- `src/components/providers/SeoMeta.astro`:
  - Props: `provider: PublicProvider`, `origin: string`.
  - Renderiza:
    - `<title>{provider.name} — {provider.trade} en {provider.commune} | QuiénSabe</title>`.
    - `<meta name="description" content={truncate(provider.description, 160)} />`.
    - `<meta property="og:type" content="profile" />`.
    - `<meta property="og:title" content={...} />`.
    - `<meta property="og:description" content={...} />`.
    - `<meta property="og:image" content={provider.photoUrl ?? '/og-default.png'} />`.
    - `<meta property="og:url" content={origin + '/p/' + provider.slug} />`.
    - `<script type="application/ld+json" set:html={buildJsonLd(provider, origin)} />`.
- `src/utils/seo.ts`:
  - `buildOgMeta(provider): { title, description, image }`.
  - `buildJsonLd(provider, origin): string` — serializa con `JSON.stringify` indentado mínimo.
  - `truncate(s: string | null, max: number): string` — `null → ''`; `s.length > max → s.slice(0, max - 3) + '...'`.

### Asset estático

- `public/og-default.png` — placeholder 1200x630 con logo y texto "QuiénSabe — Vecinos que saben".

## Flujo de interaccion (secuencial)

1. SSR de `/p/<slug>` carga perfil (HU-07.1).
2. Astro layout incluye `<SeoMeta provider={provider.data} origin={origin} />` en `<head>`.
3. HTML serializado contiene los `<meta>` y el `<script type="application/ld+json">`.
4. Crawlers leen sin JS; previsualización correcta al compartir.

## Capa de servicios

No añade servicios. Helpers en `src/lib/utils/seo.ts`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/utils/seo.test.ts` | `truncate(null) === ''`, `truncate('a'.repeat(200), 160) === 'a'.repeat(157) + '...'`; `buildOgMeta` retorna shape correcto; `buildJsonLd` retorna string parseable con `@type: "LocalBusiness"` |
| Unit | `tests/unit/validators/seo.test.ts` | `seoDescriptionSchema` rechaza 161 chars; `jsonLdSchema` valida shape completo |
| Integración | `tests/integration/providers/seo-meta.test.ts` | seed provider con/sin foto; GET `/p/<slug>`; assert `<meta property="og:title">`, `og:description` truncado a ≤160, `og:image` (URL firmada o `/og-default.png`); assert JSON-LD parseable |
| E2E | `tests/e2e/profile-seo.spec.ts` | Playwright asserts presencia única de cada `og:*` (count(og:title) === 1); valida con `JSON.parse(script.textContent)` |

## Dependencias y secuencia

- **Bloqueado por:** HU-07.1, HU-07.5 (necesita `slug` poblado).
- **Bloquea a:** ninguna directa. Mejora discoverability de todos los perfiles.
- **Recursos compartidos:** `public/og-default.png` (asset estático).

## Riesgos tecnicos

- Riesgo: el placeholder no se sirve si el path es relativo → Mitigación: usar `/og-default.png` (absoluto al origin del sitio).
- Riesgo: `JSON.stringify` de un objeto con `undefined` falla → Mitigación: usar `JSON.stringify(obj, (k,v) => v === undefined ? null : v)` o construir el objeto con `null` explícito.
- Riesgo: el `aggregateRating` aparece con `null` cuando no hay reseñas, lo cual Google rechaza → Mitigación: si `ratingAvg === null`, omitir el campo `aggregateRating` del JSON-LD completo (no pasar `null`).
- Riesgo: tests E2E son flaky con assets faltantes → Mitigación: el `og-default.png` se commitea al repo; CI lo incluye.
