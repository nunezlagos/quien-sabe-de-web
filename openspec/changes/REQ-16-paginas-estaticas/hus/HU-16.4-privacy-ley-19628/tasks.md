# HU-16.4 — /privacy cumpliendo Ley 19.628

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-16-paginas-estaticas
**Rama:** `feat/HU-16.4-privacy-ley-19628`

## Tareas tecnicas

- [ ] **T1** Extender `src/layouts/LegalLayout.astro` con un slot `hero` opcional (default vacío). Cuando se llena, se renderiza sobre el slot default con padding `py-16` y fondo `bg-primary text-white`.
- [ ] **T2** Escribir `src/content/legal/privacy.md` con frontmatter completo y las 6 secciones requeridas, cada una con `<a id="privacy-{slug}"></a>` antes del heading `##`:
  - `datos-recolectados` (email, RUT en verificación, foto perfil, datos de contacto)
  - `finalidad` (autenticación, perfil público, contacto entre vecinos, métricas agregadas)
  - `conservacion` (duración y criterio de borrado)
  - `derechos` (ARCO + P: Acceso, Rectificación, Supresión, Portabilidad)
  - `contacto` (email `privacidad@quien-sabe.cl`)
  - Más una sección `cookies` (referencia al banner inferior).
- [ ] **T3** Helper `assertPrivacySections(body)` en `src/lib/validators/privacy.ts`: parsea el Markdown, exige las 6 anclas y el email `privacidad@`; lanza `PrivacySectionsError` con detalle si falta alguna.
- [ ] **T4** Implementar `src/pages/privacy.astro` con `getEntry('legal','privacy')`, render `<Content />` dentro de `<LegalLayout>`, slot `hero` con banner azul, slot `version` con "Versión: vN", llamada a `ensureLegalVersion` para registrar versión.
- [ ] **T5** Build local: `docker exec quien-sabe-app bunx astro build`; abrir `dist/privacy/index.html` y verificar que las 6 anclas están presentes.
- [ ] **T6** Tests:
  - [ ] `tests/unit/validators/privacy.test.ts` — `assertPrivacySections` acepta body con todas las secciones; rechaza body sin `derechos`; rechaza body sin email `privacidad@`.
  - [ ] `tests/integration/pages/privacy.test.ts` — `getEntry` resuelve; `assertPrivacySections(entry.body)` no lanza; `entry.data.version === "v1"`.
  - [ ] `tests/e2e/privacy-ley-19628.spec.ts` — `page.goto('/privacy')` → 200, existen los `id` `privacy-datos-recolectados`, `privacy-finalidad`, `privacy-conservacion`, `privacy-derechos`, `privacy-contacto`, `privacy-cookies`; link `mailto:privacidad@quien-sabe.cl` presente; H1 con el title.
- [ ] **T7** Integrar `assertPrivacySections` en un check de build: agregarlo a `tests/integration/content/astro-sync.test.ts` o crear un script `bun run check:privacy` que falle el build si la página no cumple.

## Sabotajes a confirmar

1. Borrar la sección `## Cookies` de `privacy.md` → `assertPrivacySections` lanza error → test unitario rojo; si se omite el check, el test E2E también rojo → restaurar.
2. Cambiar el email de `privacidad@quien-sabe.cl` a `soporte@quien-sabe.cl` → el validador que exige el prefijo `privacidad@` falla; test E2E que busca el `mailto:` también falla → restaurar.
3. Renombrar `id="privacy-derechos"` a `id="privacy-deberechos"` (typo) → test E2E que localiza `#privacy-derechos` no encuentra el ancla → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/validators/privacy.test.ts tests/integration/pages/privacy.test.ts tests/integration/content/astro-sync.test.ts` → verde
- [ ] Tests E2E `bunx playwright test tests/e2e/privacy-ley-19628.spec.ts` → verde
- [ ] Sabotaje 1 confirmado: sección `Cookies` removida → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: email incorrecto → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: typo en `id` → test E2E rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/validators/privacy.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: /privacy con secciones Ley 19.628` y push a rama (no merge a main)
