# HU-16.1 — Content collection legal

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-16-paginas-estaticas
**Rama:** `feat/HU-16.1-content-collection-legal`

## Tareas tecnicas

- [ ] **T1** Crear `src/content/config.ts` con `defineCollection({ type:'content', schema: z.object({ title, description, version, updated_at }) })` y export `collections = { legal }`.
- [ ] **T2** Crear stubs `src/content/legal/{about,terms,privacy,faq}.md` con frontmatter completo (title, description, version: "v1", updated_at: hoy) y un párrafo de placeholder por archivo.
- [ ] **T3** Correr `docker exec quien-sabe-app bunx astro sync` para regenerar `src/content.d.ts` y commitear el archivo generado.
- [ ] **T4** Validar con `docker exec quien-sabe-app bunx astro check` que los 4 archivos cumplen el schema sin errores.
- [ ] **T5** Helper `parseLegalFrontmatter(input: string)` en `src/lib/utils/frontmatter.ts` (usa `gray-matter`) para tests unitarios independientes de Astro runtime.
- [ ] **T6** Tests:
  - [ ] `tests/unit/content/legal-collection.test.ts` — schema acepta frontmatter válido; rechaza sin `title`; rechaza `version` que no matchee `^v\d+$`; rechaza `updated_at` no parseable; acepta y rechaza cada campo opcional.
  - [ ] `tests/unit/utils/frontmatter.test.ts` — `parseLegalFrontmatter` extrae correctamente con `gray-matter` sobre un string Markdown.
  - [ ] `tests/integration/content/astro-sync.test.ts` — importar `astro:content` y enumerar entradas de `getCollection("legal")` devuelve 4 (smoke build-time).
- [ ] **T7** Documentar en `README.md` el flujo "editar copy" + comando `astro sync` (1-2 líneas en sección "Content").

## Sabotajes a confirmar

1. Borrar el campo `version` del frontmatter de `about.md` → `astro check` debe fallar con error de schema → restaurar.
2. Cambiar `version: "v1"` por `version: "1.0"` en `terms.md` → test unitario rojo (regex `^v\d+$`) → restaurar.
3. Renombrar `src/content/legal/about.md` a `src/content/legal/about.MD` (mayúsculas) y commitear → `getCollection` puede no encontrarlo; verificar el comportamiento esperado en Astro y ajustar test si es el caso.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/content tests/unit/utils/frontmatter.test.ts tests/integration/content` → verde
- [ ] Sabotaje 1 confirmado: archivo sin `version` → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: `version: "1.0"` → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: `astro check` reporta el archivo no enlistado o el test smoke falla → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/utils/frontmatter.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: content collection legal + stubs iniciales` y push a rama (no merge a main)
