# REQ-16-paginas-estaticas

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Páginas estáticas institucionales y legales: About (quiénes somos), Términos
y Condiciones, Política de Privacidad (Ley 19.628), FAQ. Renderizadas
server-side desde Markdown/MDX para edición sin redeploy.

## Criterios de éxito

- [ ] 4 páginas disponibles: `/about`, `/terms`, `/privacy`, `/faq`.
- [ ] Contenido en Markdown bajo `src/content/legal/` para edición sencilla.
- [ ] Cumplimiento Ley 19.628 explícito en `/privacy` (datos recolectados, finalidad, derechos del titular).
- [ ] FAQ con búsqueda y acordeón.
- [ ] Versión de términos versionada (acepta re-aceptación si cambia).

## Superficie técnica

### Endpoints API
- (Ninguno expone API, sólo páginas renderizadas)

### Vistas Astro
- `/about`, `/terms`, `/privacy`, `/faq`

### Tablas Drizzle
- `legal_versions` (slug, version, published_at) — para tracking de re-aceptación

### Bindings Cloudflare
- `D1` (sólo legal_versions)

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-16.1 | content-collection-legal | Astro content collection para legal | P0 |
| HU-16.2 | about-render | Página About | P0 |
| HU-16.3 | terms-render | Página Términos | P0 |
| HU-16.4 | privacy-ley-19628 | Privacidad cumpliendo Ley 19.628 | P0 |
| HU-16.5 | faq-acordeon | FAQ con acordeón y búsqueda local | P1 |
| HU-16.6 | versionado-legal | Tracking versión + re-aceptación | P2 |

## Tests requeridos

- **Unit:** parser de frontmatter, validador de schema MDX.
- **Integración:** renderizado correcto de cada página, links internos funcionan.
- **E2E:** smoke test cada página retorna 200 y tiene heading H1.

## Dependencias

- **Depende de:** —
- **Habilita a:** REQ-02 (consentimientos vinculan a versiones legales)

## Riesgos / suposiciones

- Ley 19.628 está siendo reformada (2026): revisar texto cuando se publique nueva versión.
