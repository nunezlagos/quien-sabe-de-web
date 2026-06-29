# Diseno tecnico — HU-03.3 — Upload de documentos a R2/MinIO con presigned URL

**REQ padre:** REQ-03-verificacion-prestador

## Modelo de datos

### Tabla Drizzle

```ts
// src/database/schema.ts (extracto)
export const verificationDocuments = sqliteTable('verification_documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  verificationId: integer('verification_id').notNull().references(() => providerVerifications.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: ['cedula', 'certificado_sec', 'antecedentes', 'foto_trabajo'] }).notNull(),
  r2Key: text('r2_key').notNull().unique(),
  contentType: text('content_type').notNull(),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }),  // null hasta confirm
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  byVerification: index('idx_verification_documents_verification').on(t.verificationId),
  byUnuploaded: index('idx_verification_documents_unuploaded').on(t.createdAt),
}))
```

### Migracion Drizzle

- Archivo: `src/database/migrations/0007_verification_documents.sql`.
- Cambios:
  - `CREATE TABLE verification_documents (...)` con `CHECK (kind IN ('cedula','certificado_sec','antecedentes','foto_trabajo'))` y `CHECK (content_type IN ('image/jpeg','image/png','application/pdf'))`.
  - FK a `provider_verifications(id)` con `ON DELETE CASCADE`.
  - `CREATE UNIQUE INDEX idx_verification_documents_r2key ON verification_documents(r2_key);`

## Contrato de API

### `POST /api/v1/providers/me/verification/documents` [sesión prestador]

Request:
```json
{ "kind": "cedula", "content_type": "image/jpeg" }
```

Response 200:
```json
{
  "id": 99,
  "upload_url": "https://r2.example.com/documents/42/cedula-1716...?X-Amz-Signature=...",
  "r2_key": "documents/42/cedula-1716000000-abcd",
  "expires_in": 600
}
```

Errores: 404 (sin verificación pendiente), 422 (content-type no whitelisted), 403 (no prestador).

### `POST /api/v1/providers/me/verification/documents/:id/confirm` [sesión prestador]

Marca `uploaded_at = unixepoch()`. Verifica que el objeto existe en R2 con `headObject`. Response 200 con la fila actualizada. Si el objeto no existe → 404.

## Validaciones Zod

```ts
// src/lib/validators/verification.ts (extendido)
const ALLOWED_DOC_KINDS = ['cedula', 'certificado_sec', 'antecedentes', 'foto_trabajo']
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

export const RequestPresignedDoc = z.object({
  kind: z.enum(ALLOWED_DOC_KINDS),
  content_type: z.enum(ALLOWED_CONTENT_TYPES),
})
```

## Componentes UI

No aplica nueva vista. El form de HU-03.2 se extiende con `<input type="file">` que dispara:
1. `POST /documents` → recibe `upload_url`.
2. `PUT upload_url` con el `File`.
3. `POST /documents/:id/confirm` → marca uploaded_at.

Las dropzones de `mockups/verification.html:102-117` ya tienen el layout objetivo; falta JS.

## Flujo de interaccion (secuencial)

1. Frontend pide presigned URL al backend (`POST /documents`).
2. Backend:
   a. Verifica que existe `provider_verifications` en `pendiente` para `user_id`.
   b. Genera `r2Key = "documents/<verification_id>/<kind>-<unix>-<random4>"`.
   c. Llama `signPutUrl(r2Key, content_type, 600)`.
   d. INSERT fila con `uploaded_at = NULL`.
   e. Retorna `{ id, upload_url, r2_key, expires_in: 600 }`.
3. Frontend hace `PUT upload_url` con el `File`.
4. Frontend llama `POST /documents/:id/confirm`.
5. Backend verifica que el objeto existe (`headObject`); UPDATE `uploaded_at = unixepoch()`.

## Capa de servicios

```ts
// src/lib/services/storage/r2.ts
export function getS3Client(env): S3Client  // configurado con R2 o MinIO según env
export async function signPutUrl(env, key: string, contentType: string, ttlSeconds: number): Promise<string>
export async function signGetUrl(env, key: string, ttlSeconds: number): Promise<string>  // usado por HU-03.4
export async function headObject(env, key: string): Promise<boolean>  // existe o no

// src/lib/services/verification/documents.ts
export async function requestPresignedUpload(env, db, userId, kind, contentType): Promise<...>
export async function confirmUpload(env, db, userId, documentId): Promise<VerificationDocument>
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/storage/r2.test.ts` | `signPutUrl` retorna URL con `X-Amz-Signature`, `X-Amz-Expires=600`; `headObject` retorna true/false según mock |
| Integracion | `tests/integration/verification/upload.test.ts` | POST `/documents` con kind/content-type válido → 200 con upload_url + fila con uploaded_at NULL; PUT a upload_url sube a MinIO local; POST `/confirm` → uploaded_at poblado; sin verificación pendiente → 404; content-type no whitelisted → 422 |

## Dependencias y secuencia

- **Bloqueado por:** HU-03.2 (crea `provider_verifications`).
- **Bloquea a:** HU-03.4 (admin previsualiza documentos), HU-03.5 (transiciones presuponen docs subidos).
- **Recursos compartidos:** tabla `verification_documents`, binding `R2`, env vars en `wrangler.toml.example`.

## Riesgos tecnicos

- Riesgo: `@aws-sdk/s3-request-presigner` no compatible con Workers → Mitigación: el SDK soporta el `FetchHttpHandler` que usa `fetch` global; verificar en dev con MinIO.
- Riesgo: el objeto se sube a R2 pero el confirm nunca llega → Mitigación: el admin (HU-03.4) puede ver `uploaded_at IS NULL` como "no recibido"; el admin puede pedir re-upload. Cron de limpieza fuera de MVP.
- Riesgo: dos requests simultáneos del mismo prestador pidiendo presigned URL para el mismo `kind` → Mitigación: cada uno genera su propio `r2_key` con sufijo random; no hay UNIQUE collision.
