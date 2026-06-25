# HU-07.6 — Metadatos SEO en perfiles públicos

**Estado:** implementada | **Prioridad:** P1 | **REQ padre:** REQ-07-perfil-publico

## Historia de usuario

**Como** buscadores y redes sociales
**Quiero** contar con og:title, og:image y JSON-LD
**Para** que el link se previsualice correctamente al compartir

## Criterios de aceptación (Gherkin)

### Escenario: og:title y og:description correctos
  Dado el perfil de "Juan, gasfíter en Las Condes"
  Cuando visito `/p/juan-gasfiter-las-condes`
  Entonces el HTML incluye `<meta property="og:title" content="Juan — Gasfíter en Las Condes">`
  Y `<meta property="og:description" ...>` con descripción truncada a 160 chars

### Escenario: og:image apunta a la foto del prestador
  Dado un prestador con foto
  Cuando renderiza
  Entonces `<meta property="og:image" content="<url firmada R2>">` está presente

### Escenario: JSON-LD válido tipo LocalBusiness
  Cuando se inspecciona el HTML
  Entonces existe un `<script type="application/ld+json">` con `@type: "LocalBusiness"` y campos requeridos

### Escenario: Prestador sin foto usa placeholder
  Dado un prestador sin `photo_r2_key`
  Cuando renderiza
  Entonces `og:image` apunta a `/og-default.png`

## Tareas técnicas

- [ ] Componente `src/components/providers/SeoMeta.astro`
- [ ] Helper `buildJsonLd(provider)` en `src/lib/utils/seo.ts`
- [ ] Tests `tests/unit/utils/seo.test.ts`, `tests/e2e/profile-seo.spec.ts` (asserta meta tags)

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
