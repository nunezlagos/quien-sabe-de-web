# HU-22.2 — Página /privacy cubriendo Ley 19.628

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-22-compliance-ley-19628

## Historia de usuario

**Como** usuario
**Quiero** leer la política de privacidad completa
**Para** conocer qué datos se tratan y mis derechos

## Criterios de aceptación (Gherkin)

### Escenario: Página existe y renderiza
  Cuando navego a `/privacy`
  Entonces obtengo status 200
  Y el contenido cubre Art. 12 (derechos) y Art. 13 (catastro) de la Ley 19.628

### Escenario: Secciones requeridas
  Cuando reviso el documento
  Entonces aparecen: Datos recolectados, Finalidades, Responsable, Derechos ARCO+P, Plazo de conservación, Transferencias, Contacto del DPO

### Escenario: Estilo idéntico a terms
  Cuando comparo con `mockups/terms.html`
  Entonces uso el mismo layout (`max-w-4xl mx-auto`, headings `text-2xl font-extrabold`, párrafos `text-gray-600 text-sm leading-relaxed`)

### Escenario: Link desde footer
  Cuando estoy en cualquier página
  Entonces el footer expone link "Privacidad" entre "Términos" y "Transparencia" (referencia `mockups/dashboard-user.html:135-139`)

## Tareas técnicas

- [ ] Vista Astro `src/pages/privacy.astro`
- [ ] Layout heredando de `src/layouts/Layout.astro`
- [ ] Texto legal en `src/content/legal/privacy.md` revisado por abogado
- [ ] Actualizar footer global con link a `/privacy`
- [ ] Tests E2E `tests/e2e/privacy-page.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
