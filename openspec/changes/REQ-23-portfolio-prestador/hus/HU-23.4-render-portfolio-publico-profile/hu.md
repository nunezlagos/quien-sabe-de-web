# HU-23.4 — Render del portfolio público en profile.html

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-23-portfolio-prestador

## Historia de usuario

**Como** vecino
**Quiero** ver el portafolio del prestador en su perfil público
**Para** evaluar la calidad de sus trabajos

## Criterios de aceptación (Gherkin)

### Escenario: Render SSR sustituye mock
  Cuando navego a `/p/juan-perez-gasfiter`
  Entonces el contenedor `#profile-portfolio-container` (`mockups/profile.html:146`) se popula desde D1 vía SSR
  Y se usa el template `portfolio-grid-template` (`mockups/profile.html:179-182`) con grid `grid-cols-2 md:grid-cols-3 gap-3`
  Y cada item usa `portfolio-item-template` (`mockups/profile.html:184-189`) con la `<img class="...portfolio-img">`

### Escenario: Prestador sin imágenes
  Dado prestador con 0 imágenes
  Cuando renderizo el perfil
  Entonces la sección "Trabajos" (`mockups/profile.html:142-149`) muestra estado vacío "Aún no hay trabajos cargados"

### Escenario: URLs apuntan a R2/MinIO
  Cuando inspecciono `<img src>` en el HTML server-rendered
  Entonces apunta a CDN R2 (prod) o `http://localhost:9002/...` (dev MinIO)

### Escenario: Cache edge respeta TTL
  Cuando consulto dos veces seguidas
  Entonces el segundo hit viene de edge cache (max-age=60)

## Tareas técnicas

- [ ] Modificar `src/pages/p/[slug].astro` (REQ-07) para hidratar `<section id="profile-portfolio-container">` desde Drizzle
- [ ] Helper `getPortfolioUrls(providerId, env)` en `src/lib/services/portfolio/render.ts`
- [ ] Empty state component `<EmptyPortfolio />`
- [ ] Tests `tests/e2e/profile-portfolio.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
