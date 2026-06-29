# HU-15.6 — Boletas adjuntas en R2 con link público firmado

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-15-transparencia-publica
**Rama:** `feat/HU-15.6-boletas-en-r2`

## Tareas técnicas

- [ ] **T1** Constantes `ALLOWED_DOC_TYPES` en `src/lib/validators/expenses.ts` (`application/pdf`, `image/png`, `image/jpeg`) y `MAX_DOC_SIZE = 10 * 1024 * 1024`.
- [ ] **T2** Validadores `requestUploadSchema` y `confirmUploadSchema` (regex para `r2_key` con prefijo `expenses/<expense_id>/<ulid>.<ext>`).
- [ ] **T3** Servicio `src/lib/services/expenses-documents.ts` con `requestUpload`, `confirmUpload` (incluye HEAD R2 antes de actualizar D1), `deleteDocument` (borra R2 + setea NULL), `getPublicSignedUrl`.
- [ ] **T4** Endpoints:
  - `src/pages/api/v1/admin/expenses/[id]/document.ts` (POST request upload, PATCH confirm, DELETE). 413 si >10MB.
  - `src/pages/api/v1/public/expenses/[id]/document-url.ts` (GET, público). 404 si expense sin `document_r2_key` o si HEAD R2 falla.
- [ ] **T5** Helper R2 `signPutUrl(env, key, ttlSec, contentType)` que firma con el `Content-Type` esperado (R2 rechaza PUT con tipo distinto al firmado).
- [ ] **T6** Convención de keys: `expenses/<expense_id>/<ulid>.<ext>` donde `<ext>` se deriva del `Content-Type` validado (no del nombre original del archivo).
- [ ] **T7** Componente `src/components/admin/DocumentUploader.astro` con props `{expenseId, currentKey?}`. Mockup base patrón input file del dashboard admin (`mockups/dashboard-admin.html:287-342`). Isla con 3 pasos cliente.
- [ ] **T8** Actualizar `src/components/transparency/ExpenseRow.astro` (HU-15.3):
  - Si `has_document` → `<a class="text-blue-500 hover:underline">Ver Boleta</a>` (mockup `mockups/transparency.html:81`).
  - Si no → `<span class="text-gray-400 text-xs italic">Donación directa</span>` (mockup `mockups/transparency.html:93`).
  - Isla lazy: click intercepta, pide `GET /api/v1/public/expenses/:id/document-url`, luego `window.open(url)`.
- [ ] **T9] Janitor opcional (cron semanal) que barre objetos en `expenses/` sin fila D1 asociada. Marcar como follow-up en code comment, fuera del scope inmediato.
- [ ] **T10** Tests:
  - [ ] `tests/unit/validators/expense-document.test.ts` — `requestUploadSchema` rechaza tipos prohibidos y tamaños >10MB; `confirmUploadSchema` valida formato de key.
  - [ ] `tests/unit/services/expenses-documents.test.ts` — `getPublicSignedUrl` retorna null para expense sin documento.
  - [ ] `tests/integration/transparency/expense-doc.test.ts` — 3 escenarios Gherkin: subir+vincular, visitante ve link firmado en `/transparency`, expense sin documento NO expone link; URL firmada caduca tras 1h (mockear `Date.now`).
  - [ ] `tests/e2e/expense-document.spec.ts` — admin sube PDF → visitante anónimo abre `/transparency`, click "Ver Boleta", descarga llega.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `confirmUpload`, omitir el HEAD R2 → confirmar key inexistente, test integración rojo (debería 422) → restaurar
- [ ] Sabotaje 2: en `getPublicSignedUrl`, retornar URL sin firma → visitante descarga 403, test integración rojo → restaurar
- [ ] Sabotaje 3: en `deleteDocument`, no borrar el objeto R2 (sólo el campo D1) → test integración que verifica R2 vacío rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/expenses-documents.ts`
- [ ] Type check verde
- [ ] Commit `feat: boletas R2 con link público firmado` y push