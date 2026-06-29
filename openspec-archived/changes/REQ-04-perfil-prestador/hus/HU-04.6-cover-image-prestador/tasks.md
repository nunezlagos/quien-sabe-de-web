# HU-04.6 — Cover image (hero) del prestador en R2

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-04-perfil-prestador
**Rama:** `feat/HU-04.6-cover-image-prestador`

## Tareas tecnicas

- [ ] **T1** Verificar que `providers.cover_r2_key` exista en `src/database/schema.ts` (de HU-04.1). Si no, generar migración `0003_provider_cover.sql` con `ALTER TABLE providers ADD COLUMN cover_r2_key TEXT`.
- [ ] **T2** Extender `resizeImage(buffer, width, height, opts?)` en `src/lib/services/media/resize.ts` (parametrizable; HU-04.3 ya pasa `256,256`, acá `1200,400` con `quality: 80`).
- [ ] **T3** Agregar `validateCoverUpload(buffer, mime)` en `src/lib/services/media/validation.ts` con límite 8 MB (reuso de `validateImageUpload` parametrizada).
- [ ] **T4** Servicio `updateCover(db, userId, coverR2Key)` en `src/lib/services/providers.ts` que retorna `{ oldKey }` para cleanup.
- [ ] **T5** Endpoint `src/pages/api/v1/providers/me/cover.ts` (POST). Secuencia: validar → resize 1200x400 → put → UPDATE providers → delete oldKey → devolver 200.
- [ ] **T6** Componente `src/components/profile/Hero.astro` con props `coverUrl: string | null`, `title`, `subtitle`. Si coverUrl → `style="background-image: url(...)"` + `bg-cover bg-center`. Si null → `bg-gradient-to-r from-primary to-primary-dark`. Siempre `text-white py-16` + overlay `bg-black/20`.
- [ ] **T7** Integrar `Hero.astro` en `src/pages/p/[slug].astro` (de HU-07; si esa HU aún no existe, dejar placeholder documentado).
- [ ] **T8** Tests:
  - [ ] `tests/unit/media/resize.test.ts` (extender) — `resizeImage(buf, 1200, 400)` → dimensiones exactas.
  - [ ] `tests/unit/media/validation.test.ts` (extender) — 9 MB → throw; PDF → throw.
  - [ ] `tests/integration/providers/cover-upload.test.ts` — happy path 200, PDF 415, 9 MB 413, reemplazo limpia anterior.
  - [ ] `tests/integration/providers/render.test.ts` — `GET /p/<slug>` con cover contiene URL; sin cover contiene clase gradient.
  - [ ] `tests/e2e/profile-cover-render.spec.ts` — Playwright: dashboard → upload → ver cover en perfil.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Cambiar el `resizeImage` de esta HU para retornar dimensiones incorrectas (ej: 800x300) → `tests/unit/media/resize.test.ts` (caso 1200x400) debe caer → restaurar.
- [ ] **S2** Quitar el `try/catch` del cleanup y forzar error en `R2.delete` → la respuesta del endpoint debe seguir siendo 200 (cleanup best-effort) → verificar con test que espera 200 + warning log → restaurar.
- [ ] **S3** Cambiar el fallback del componente Hero para que muestre `<header class="bg-white">` (sin gradient) cuando coverUrl es null → `tests/integration/providers/render.test.ts` debe caer (response no contiene clase gradient) → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Tests Playwright `tests/e2e/profile-cover-render.spec.ts` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en componentes nuevos y helpers extendidos
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
