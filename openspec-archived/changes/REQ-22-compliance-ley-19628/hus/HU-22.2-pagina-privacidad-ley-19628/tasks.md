# HU-22.2 — Página /privacy cubriendo Ley 19.628

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-22-compliance-ley-19628
**Rama:** `feat/HU-22.2-pagina-privacidad-ley-19628`

## Tareas técnicas

- [ ] **T1** Crear `src/content/legal/privacy.md` con frontmatter `title`, `lastUpdated` y las 7 secciones h2 obligatorias (Datos recolectados, Finalidades del tratamiento, Responsable del tratamiento, Derechos ARCO+P, Plazo de conservación, Transferencias internacionales, Contacto del DPO). Texto placeholder para revisión legal posterior.
- [ ] **T2** Configurar `src/content/config.ts` con collection `legal` y schema Zod (`title: string`, `lastUpdated: string` formato ISO date).
- [ ] **T3** Crear vista `src/pages/privacy.astro` que importa el markdown y renderiza con `<Content />` dentro de la card `bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100`.
- [ ] **T4** Agregar link "Privacidad" en `src/components/layout/Footer.astro` (si existe) entre los links "Términos" y "Transparencia", con clases `hover:text-primary transition font-bold text-gray-300 hover:scale-105 transform`.
- [ ] **T5] Si no existe `Footer.astro` consolidado, crearlo extrayendo el patrón de `mockups/dashboard-user.html:117-146` y usarlo en `Layout.astro`. Refactor mínimo de las páginas existentes para usar el componente.
- [ ] **T6** Tests:
  - [ ] `tests/e2e/privacy-page.spec.ts` (Playwright) — `GET /privacy` devuelve 200; HTML contiene los 7 h2 (`text=Datos recolectados`, `text=Finalidades`, etc.); footer expone `<a href="/privacy">Privacidad</a>`; la card tiene clase `bg-white p-8 md:p-12 rounded-3xl`.
  - [ ] Sabotaje 1: borrar la sección "Derechos ARCO+P" del `privacy.md` → E2E verifica que el heading `text=Derechos ARCO` está presente (test rojo) → restaurar.
  - [ ] Sabotaje 2: cambiar el `href` del link en el footer a `/terms` (copia mal) → E2E verifica `href="/privacy"` (test rojo) → restaurar.
  - [ ] Sabotaje 3: en la vista, olvidar `max-w-4xl` en el container → E2E verifica que el ancho del main es ≤ 896px (test rojo en viewports grandes) → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde (incluye las 7 secciones y footer link)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % (no aplica estrictamente a páginas estáticas; medir que el HTML generado contiene las 7 secciones)
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: página /privacy Ley 19.628` y push a rama (no merge a main)
- [ ] **Pendiente externo**: revisión y aprobación del DPO/abogado antes de merge a main (bloqueante para producción; el dev senior puede auto-revisar en este proyecto)