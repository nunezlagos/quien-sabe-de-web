# Diseño técnico — HU-15.6 — Boletas adjuntas en R2 con link público firmado

**REQ padre:** REQ-15-transparencia-publica

## Modelo de datos

Reutiliza `expenses.document_r2_key` de HU-15.1. No introduce columnas nuevas.

Convención de keys R2 (bucket privado `BUCKET`):

- `expenses/<expense_id>/<ulid>.<ext>` — el `ulid` evita colisiones si admin sube reemplazos; la extensión se deriva del `Content-Type` validado.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response | Errores |
|---|---|---|---|---|---|
| `/api/v1/admin/expenses/:id/document` | POST | sesión admin | `{ content_type: "application/pdf" \| "image/png" \| "image/jpeg", content_length: number }` | `200 { upload_url, r2_key, expires_in: 600 }` | 400 tipo/tamaño inválido, 401, 403, 404 expense, 413 si >10 MB |
| `/api/v1/admin/expenses/:id/document` | PATCH | sesión admin | `{ r2_key }` | `200 { expense }` (con `document_r2_key` actualizado) | 400, 401, 403, 404, 422 si objeto R2 no existe |
| `/api/v1/admin/expenses/:id/document` | DELETE | sesión admin | — | `204` | 401, 403, 404 |
| `/api/v1/public/expenses/:id/document-url` | GET | público | — | `200 { url, expires_at }` (URL firmada 1 h) | 404 si expense no tiene `document_r2_key` |

## Validaciones Zod

```ts
// src/lib/validators/expenses.ts (pseudocódigo) — extiende HU-15.2
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/png', 'image/jpeg'] as const

export const requestUploadSchema = z.object({
  content_type: z.enum(ALLOWED_DOC_TYPES),
  content_length: z.number().int().positive().max(10 * 1024 * 1024), // 10 MB
})

export const confirmUploadSchema = z.object({
  r2_key: z.string().regex(/^expenses\/[0-9A-HJKMNP-TV-Z]{26}\/[0-9A-HJKMNP-TV-Z]{26}\.(pdf|png|jpe?g)$/),
})
```

## Componentes UI

### Páginas Astro

- Reusa `src/pages/transparency.astro` (HU-15.3) y `src/pages/admin/index.astro` (HU-15.2).

### Componentes Astro reutilizables

- `src/components/admin/DocumentUploader.astro` — props: `expenseId: string`, `currentKey?: string`.
  - Mockup base: patrón input file del dashboard admin; UI a diseñar siguiendo `mockups/dashboard-admin.html:287-342` (estructura modal/form).
  - Islas requeridas: sí — 3 pasos cliente: solicitar presigned, hacer PUT directo a R2, confirmar con PATCH.
- `src/components/transparency/ExpenseRow.astro` (definido en HU-15.3) — actualizar para que la celda "Comprobante":
  - Si `has_document` → renderiza `<a class="text-blue-500 hover:underline">Ver Boleta</a>` (mockup `mockups/transparency.html:81`).
  - Si no → renderiza `<span class="text-gray-400 text-xs italic">Donación directa</span>` (mockup `mockups/transparency.html:93`).
  - Islas requeridas: sí (lazy) — el click intercepta navegación, pide `GET /api/v1/public/expenses/:id/document-url`, luego `window.open(url)`.

## Flujo de interacción (secuencial)

### Flujo Upload (admin)

1. Admin abre formulario de gasto y elige archivo en `DocumentUploader` (mockup `mockups/dashboard-admin.html:287` patrón modal).
2. Cliente: lee `file.type` y `file.size`, envía `POST /api/v1/admin/expenses/<id>/document` con `{ content_type, content_length }`.
3. Servidor valida con `requestUploadSchema`, genera `r2_key = expenses/<id>/<ulid>.<ext>`, devuelve presigned PUT URL firmada por 10 min (helper R2 reusado).
4. Cliente: `fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file })`.
5. Cliente: `PATCH /api/v1/admin/expenses/<id>/document { r2_key }`.
6. Servidor: `HEAD` el objeto en R2; si existe, actualiza `expenses.document_r2_key`; si no, 422.
7. UI muestra confirmación con thumbnail/link "Ver documento" (link firmado 1 h).

### Flujo Lectura (visitante)

1. Visitante carga `/transparency` (HU-15.3); tabla renderiza filas con badge "Ver Boleta" solo cuando `has_document=true`.
2. Click en "Ver Boleta" — isla intercepta y llama `GET /api/v1/public/expenses/<id>/document-url`.
3. Servidor lee `document_r2_key` desde D1, valida que el objeto existe (HEAD R2), retorna URL firmada GET 1 h.
4. Isla abre la URL en nueva pestaña.

### Flujo Eliminación

1. Admin abre detalle y pulsa "Eliminar documento" en `DocumentUploader`.
2. `DELETE /api/v1/admin/expenses/<id>/document` → servidor borra objeto R2 y setea `document_r2_key = NULL` en D1.

## Capa de servicios

- `src/lib/services/expenses-documents.ts` — métodos:
  - `requestUpload(env, expenseId, input): Promise<{ upload_url: string; r2_key: string; expires_in: number }>`
  - `confirmUpload(env, expenseId, r2Key, actorId): Promise<Expense>` — incluye HEAD R2.
  - `deleteDocument(env, expenseId, actorId): Promise<void>` — borra R2 + setea NULL D1.
  - `getPublicSignedUrl(env, expenseId): Promise<{ url: string; expires_at: string } | null>` — null si sin documento o objeto faltante.
- Reusa `signPutUrl` y `signGetUrl` del helper R2 introducido en REQ-03 (`hu.md:31`).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/expense-document.test.ts` | `requestUploadSchema` rechaza tipos prohibidos y tamaños >10 MB; `confirmUploadSchema` valida formato de key |
| Unit | `tests/unit/services/expenses-documents.test.ts` | `getPublicSignedUrl` retorna null para expense sin documento |
| Integración | `tests/integration/transparency/expense-doc.test.ts` | 3 escenarios Gherkin: subir+vincular, visitante ve link firmado en `/transparency`, expense sin documento NO expone link |
| Integración | `tests/integration/transparency/expense-doc.test.ts` | URL firmada caduca tras 1 h (mockear `Date.now`) |
| E2E | `tests/e2e/expense-document.spec.ts` | Admin sube PDF → visitante anónimo abre `/transparency`, click "Ver Boleta", descarga llega |

## Dependencias y secuencia

- **Bloqueado por:** HU-15.1 (columna `document_r2_key`), HU-15.2 (CRUD expenses), HU-15.3 (vista pública), REQ-03 (helpers R2 presigned).
- **Bloquea a:** —
- **Recursos compartidos:** bucket R2 `BUCKET`, helper `signGetUrl`/`signPutUrl`, componente `ExpenseRow.astro`.

## Riesgos técnicos

- Riesgo: cliente miente sobre `content_type` en step 2 y sube otro tipo en step 4 → Mitigación: presigned PUT firma incluye el `Content-Type` esperado; R2 rechaza si difiere.
- Riesgo: race condition entre upload (paso 4) y confirm (paso 5) si admin cancela en medio → Mitigación: TTL 10 min en presigned; janitor opcional barre objetos en `expenses/` sin fila asociada en D1.
- Riesgo: extension/Content-Type mismatch deja archivos con extensión incorrecta → Mitigación: derivar extensión del `Content-Type` validado, no del nombre original.
- Riesgo: visitante guarda URL firmada y la comparte → Mitigación: aceptable por diseño (boletas son públicas); TTL 1 h limita uso prolongado.
