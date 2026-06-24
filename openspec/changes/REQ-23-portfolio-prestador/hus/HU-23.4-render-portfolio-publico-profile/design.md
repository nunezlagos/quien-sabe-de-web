# Diseño técnico — HU-23.4 — Render del portfolio público en profile.html

**REQ padre:** REQ-23-portfolio-prestador

## Modelo de datos

Sólo lectura sobre `portfolio_images` (HU-23.1). No introduce columnas.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/providers/:id/portfolio` | GET | público | — | `{ items: [{ id, url, sortOrder }] }` ordenado por `sortOrder ASC` | 404 (provider no existe), 410 (provider soft-deleted) |

Este endpoint es opcional para esta HU (la página `/p/[slug]` no lo necesita porque hace SSR directo), pero se expone para reuso del dashboard (HU-23.5) y consumidores futuros.

## Validaciones Zod

```ts
// src/lib/validators/portfolio.ts (pseudocódigo)
export const providerIdParamSchema // { id: coerce.number().int().positive() }
```

## Componentes UI

### Páginas Astro

- `src/pages/p/[slug].astro` — página de perfil público (definida originalmente en REQ-07). Esta HU añade el bloque "Trabajos" hidratado desde D1.
- Mockup base: `mockups/profile.html:141-149` para la sección y `mockups/profile.html:184-189` para cada item.

### Componentes Astro reutilizables

- `src/components/portfolio/PortfolioGrid.astro` — props: `{ items: PortfolioItem[], editable: boolean }`. Cuando `editable=false` (este caso) emite sólo `<img>` sin botón delete.
  - Mockup base: `mockups/profile.html:179-189` (template `portfolio-grid-template` + `portfolio-item-template`).
  - Islas requeridas: no (público sin interacción).
- `src/components/portfolio/EmptyPortfolio.astro` — empty state con texto "Aún no hay trabajos cargados".
  - Mockup base: `mockups/profile.html:141-149` (UI a diseñar siguiendo el estilo de "Sobre mí" cuando está vacío).

## Flujo de interacción (secuencial)

1. Vecino navega a `/p/juan-perez-gasfiter`.
2. Astro frontmatter resuelve `slug → providerId` (vía REQ-07) y llama `getPortfolioUrls(providerId, env)`.
3. El helper consulta D1 ordenado por `sort_order ASC` y resuelve URLs públicas (R2 CDN o MinIO).
4. Astro emite el grid `grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 portfolio-grid` con un `<img class="...portfolio-img">` por item, o `<EmptyPortfolio />` si vacío.
5. Worker añade `Cache-Control: public, max-age=60, s-maxage=60`.

## Capa de servicios

- `src/lib/services/portfolio/render.ts`
  - `getPortfolioUrls(db, env, providerId): Promise<Array<{ id, url, sortOrder }>>`
  - `resolveR2PublicUrl(env, r2Key): string` — concatena base CDN R2 (prod) o `http://localhost:9002/<bucket>/<key>` (dev).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/portfolio/render.test.ts` | `resolveR2PublicUrl` produce host correcto según env; orden por `sort_order` |
| Integración | `tests/integration/portfolio/get-public.test.ts` | `GET /api/v1/providers/:id/portfolio` devuelve items ordenados; 404 si provider no existe |
| E2E | `tests/e2e/profile-portfolio.spec.ts` | Visitar `/p/<slug>` muestra grid SSR con N imágenes; empty state si 0 imágenes; segundo hit cae en cache |

## Dependencias y secuencia

- **Bloqueado por:** HU-23.1, REQ-07 (existencia de `/p/[slug].astro`).
- **Bloquea a:** HU-23.5 (reusa `PortfolioGrid.astro` con `editable=true`).
- **Recursos compartidos:** binding `DB`, base URL pública de R2/MinIO.

## Riesgos técnicos

- Riesgo: prestador soft-deleted (REQ-22) sigue siendo accesible vía cache → mitigación: invalidar cache emitiendo header `Vary` y bajando `max-age` a 60s; recheck en cada request del flag `deleted_at`.
- Riesgo: imagen muy pesada en MinIO local degrada DX → mitigación: resize ya garantizado en 800x800 por HU-23.2.
- Riesgo: discrepancia entre clases CSS del mockup y del componente al refactorizar → mitigación: tests E2E afirman presencia de clases exactas `grid-cols-2 md:grid-cols-3 gap-3` y `portfolio-img`.
