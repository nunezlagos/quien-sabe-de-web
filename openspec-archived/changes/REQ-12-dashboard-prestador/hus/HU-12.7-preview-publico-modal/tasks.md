# HU-12.7 — Preview público en modal iframe

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-12-dashboard-prestador
**Rama:** `feat/HU-12.7-preview-publico-modal`

## Tareas técnicas

- [ ] **T1** Validador `previewQuerySchema` en `src/lib/validators/preview.ts` (Zod: `preview: 'true'` opcional).
- [ ] **T2** Servicio `src/lib/services/profile-views.service.ts` (o extender REQ-04 si ya existe) con `recordView(env, providerId, request)` que incluye la guarda:
  - Si `URL.searchParams.get('preview') === 'true'` Y sesión actual pertenece al `provider_id` del slug → return sin insertar.
  - Si preview=true pero sesión es de otro usuario → insertar (paranoia; comportamiento documentado).
- [ ] **T3** Asegurar que `src/pages/p/[slug].astro` lea el query `preview=true` y pase el flag al `recordView`. Si la ruta no existe, crearla como parte de REQ-07.
- [ ] **T4** Componente `src/components/dashboard/provider/PreviewButton.astro` con prop `slug`. Mockup `mockups/dashboard-provider.html:71-75`. Botón que dispara el modal.
- [ ] **T5** Componente `src/components/dashboard/provider/PreviewModal.astro` con prop `slug`. Mockup `mockups/dashboard-provider.html:443-468`. Header con badge + cerrar, `<iframe src="/p/${slug}?preview=true">`. Isla `client:visible`.
- [ ] **T6** Isla JS asociada al modal:
  - Click en `PreviewButton` → `document.body.style.overflow = 'hidden'` y abrir modal.
  - Al abrir, `iframe.src = iframe.src` para forzar recarga.
  - Cerrar (X o backdrop) → `document.body.style.overflow = ''`.
  - Trap básico de foco (si no hay modal compartido con trap en otros lugares, implementar mínimo).
- [ ] **T7** Integrar `PreviewButton` y `PreviewModal` en `dashboard-provider.astro`. El modal vive en el root del DOM (fuera del flujo normal) para evitar problemas de overflow.
- [ ] **T8** Headers `Cache-Control: no-store` en `/p/[slug].astro` cuando `preview=true`.
- [ ] **T9** Tests:
  - [ ] `tests/unit/services/profile-views-preview.test.ts` — `recordView` ignora preview del propio prestador, registra preview de tercero.
  - [ ] `tests/unit/validators/preview.test.ts` — `preview=true` válido, `preview=false` inválido.
  - [ ] `tests/integration/preview/no-view-counted.test.ts` — `GET /p/:slug?preview=true` con sesión del owner no incrementa contador; preview sin sesión no incrementa (política documentada).
  - [ ] `tests/e2e/provider-preview-modal.spec.ts` — abrir modal → ver iframe cargado → cerrar → scroll preservado. Editar biografía → reabrir → ver cambio.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `recordView`, quitar la guarda de `preview + owner` → la vista del owner se cuenta, test integración rojo → restaurar
- [ ] Sabotaje 2: en la isla del modal, olvidar `iframe.src = iframe.src` al reabrir → el iframe muestra caché viejo, test E2E rojo tras editar → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/profile-views.service.ts`, `src/lib/validators/preview.ts`
- [ ] Type check verde
- [ ] Commit `feat: preview público en modal iframe` y push