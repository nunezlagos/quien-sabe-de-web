# Diseno tecnico — HU-03.4 — Cola de verificación en dashboard admin

**REQ padre:** REQ-03-verificacion-prestador

## Modelo de datos

Sin cambios. Esta HU sólo lee tablas existentes (`provider_verifications`, `verification_documents`, `users`) y genera URLs firmadas.

## Contrato de API

### `GET /api/v1/admin/verifications?status=pendiente&limit=10&cursor=...` [admin]

Response 200:
```json
{
  "items": [
    {
      "id": 42,
      "rut_masked": "12.***.*5",
      "provider": { "id": 7, "name": "Roberto Gómez", "email": "roberto@gmail.com" },
      "created_at": 1716000000,
      "documents": [
        { "id": 99, "kind": "cedula", "uploaded_at": 1716000123, "r2_key": "documents/42/cedula-..." }
      ]
    },
    ...
  ],
  "cursor": "eyJjcmVhdGVkX2F0IjoxNzE2MDAwMTIzLCJpZCI6NDJ9"
}
```

Si no hay más → `cursor: null`. Errores: 403 (no admin), 400 (status inválido).

### `GET /api/v1/admin/verifications/:id/documents/:docId/preview` [admin]

Response 200:
```json
{ "preview_url": "https://r2.example.com/...?X-Amz-Signature=...", "expires_in": 300 }
```

Errores: 403 (no admin), 404 (verification o document no existe).

## Validaciones Zod

```ts
// src/lib/validators/admin.ts
export const ListVerificationsQuery = z.object({
  status: z.enum(['pendiente', 'verificado', 'rechazado']).default('pendiente'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  cursor: z.string().optional(),
})

export const CursorPayloadSchema = z.object({
  created_at: z.number().int(),
  id: z.number().int(),
})

export function encodeCursor(payload: { created_at: number; id: number }): string  // base64
export function decodeCursor(cursor: string): CursorPayload  // valida con Zod
```

## Componentes UI

- Sección `src/components/admin/VerificationsQueue.astro` que se monta en `/dashboard-admin#verifications` (siguiendo layout de `mockups/dashboard-admin.html:225-264`).
- Tabla con columnas: Usuario | Oficio | Documentos (links a `/preview`) | Fecha | Acción.
- Paginación "Ver más" consume `cursor` del response.

## Flujo de interaccion (secuencial)

### Listado

1. Admin abre `/dashboard-admin#verifications`.
2. Frontend pide `GET /admin/verifications?status=pendiente&limit=10`.
3. Backend valida rol admin, valida query, decodea cursor (si hay).
4. Query: `SELECT * FROM provider_verifications WHERE status = ? AND (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT ?`.
5. JOIN con `users` para datos del prestador; JOIN con `verification_documents` para documentos.
6. Genera next cursor si `items.length === limit`.
7. Enmascara RUT.
8. Retorna `{ items, cursor }`.

### Preview

1. Click en link "Certificado SEC".
2. Frontend pide `GET /admin/verifications/42/documents/99/preview`.
3. Backend valida rol admin, verifica que el document pertenece a la verification.
4. Llama `signGetUrl(env, r2_key, 300)`.
5. Retorna `{ preview_url, expires_in: 300 }`.
6. Frontend abre `preview_url` en nueva tab.

## Capa de servicios

```ts
// src/lib/services/admin/verifications.ts
export async function listVerifications(db, query: ListVerificationsQuery): Promise<{ items: VerificationView[]; cursor: string | null }>
export async function getDocumentPreviewUrl(env, db, verificationId: number, documentId: number): Promise<{ preview_url: string; expires_in: 300 }>
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/admin/cursor.test.ts` | `encodeCursor` + `decodeCursor` roundtrip; `decodeCursor` rechaza base64 basura; valida shape con Zod |
| Integracion | `tests/integration/admin/verifications-list.test.ts` | 12 pendientes + limit=10 → 10 items + cursor; segunda página con cursor → 2 items + cursor=null; filtro por status distinto; 403 sin admin |
| Integracion | `tests/integration/admin/verifications-preview.test.ts` | 200 con preview_url firmada (verifica presencia de `X-Amz-Signature`); TTL 300s; 404 si document no pertenece a verification |

## Dependencias y secuencia

- **Bloqueado por:** HU-01.1 (`users`), HU-03.2 (`provider_verifications`), HU-03.3 (`verification_documents` + `signGetUrl`).
- **Bloquea a:** REQ-13 (integra en dashboard-admin), HU-03.5 (transiciones).
- **Recursos compartidos:** tabla `provider_verifications`, `signGetUrl` de HU-03.3.

## Riesgos tecnicos

- Riesgo: el cursor permite enumerar IDs si está mal validado → Mitigación: el cursor es opaco (base64); el payload interno se valida con Zod antes de usarse en SQL; el query siempre filtra por `status`.
- Riesgo: la query con `(created_at, id) < (?, ?)` no usa índice compuesto → Mitigación: agregar índice `idx_provider_verifications_status_created ON provider_verifications(status, created_at DESC, id DESC)` en una migración adicional (puede ser 0008).
- Riesgo: RUT completo se filtra por error en algún campo → Mitigación: el response siempre usa `maskRut`; test verifica que `rut` (sin sufijo) NO aparece en el JSON.
