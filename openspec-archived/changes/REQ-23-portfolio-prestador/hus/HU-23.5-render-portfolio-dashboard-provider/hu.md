# HU-23.5 — Render galería editable en dashboard prestador

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-23-portfolio-prestador

## Historia de usuario

**Como** prestador
**Quiero** ver y gestionar mis fotos desde el dashboard
**Para** mantener mi portafolio actualizado

## Criterios de aceptación (Gherkin)

### Escenario: Grid refleja fotos actuales
  Cuando navego a `/dashboard-provider`
  Entonces la sección "Galería de Trabajos" (`mockups/dashboard-provider.html:151-187`) muestra mis fotos reales
  Y el counter superior derecha conserva "Máx. 5 fotos" (línea 155)

### Escenario: Slots vacíos visibles cuando < 5
  Dado prestador con 2 fotos
  Cuando renderizo el grid
  Entonces aparecen 2 cards con imagen + delete hover (estilo líneas 160-171)
  Y N slots "Vacío" (estilo `bg-gray-50 rounded-xl border-2 border-dashed border-gray-200`, línea 174-179)
  Y el botón "Add" sólo aparece si hay capacidad (`+` con icono `ri-add-line`, línea 182-185)

### Escenario: Upload desde botón add
  Cuando hago clic en el label upload (`<input type="file" accept="image/*">`, línea 184)
  Entonces se invoca POST de HU-23.2 y la nueva imagen aparece sin recargar

### Escenario: Estado de carga
  Cuando estoy subiendo
  Entonces el slot muestra spinner reutilizando el patrón del page-loader de `mockups/index.html:23-33`

## Tareas técnicas

- [ ] Modificar `src/pages/dashboard-provider.astro` para portar fielmente el grid del mockup
- [ ] Componente `<PortfolioGrid editable={true} />` en `src/components/portfolio/PortfolioGrid.astro`
- [ ] Cliente JS reusa `src/lib/client/portfolio.ts`
- [ ] Tests `tests/e2e/dashboard-portfolio.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
