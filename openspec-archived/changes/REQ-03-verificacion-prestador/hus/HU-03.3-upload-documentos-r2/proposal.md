# Propuesta — HU-03.3 — Upload de documentos a R2/MinIO con presigned URL

**Estado:** propuesta | **REQ padre:** REQ-03-verificacion-prestador

## Contexto

Una vez la verificación está `pendiente`, el prestador necesita subir cédula, certificado SEC y antecedentes. Esta HU implementa el patrón "presigned URL": el backend emite una URL temporal (TTL 600s) que el cliente usa con `PUT` directo al storage (R2 en prod, MinIO en dev). El backend nunca proxy del archivo, ahorrando bandwidth y manteniendo separation of concerns. Almacenamos la key y content-type en `verification_documents` con `uploaded_at=NULL`; un endpoint de confirmación marca `uploaded_at` cuando el PUT termina OK.

## Mockups de referencia

- `mockups/verification.html:102-117` — dropzones para "Certificaciones / Cursos" y "Fotos de trabajos". Esta HU define el backend; los dropzones del frontend se conectan con JS que pide presigned URL y hace `PUT` directo.

## Alternativas consideradas

### Opcion A — Presigned PUT URL contra R2/MinIO (S3-compatible)
- Backend genera URL con `signPutUrl(key, contentType, 600)` usando AWS SDK v3 (`@aws-sdk/s3-request-presigner`).
- Cliente hace `fetch(url, { method: 'PUT', body: file })`.
- Cliente confirma con `POST /documents/:id/confirm`.
- Pro: el archivo viaja directo al bucket; el backend no proxy; latencia mínima.
- Pro: TTL corto (600s) limita ventana de abuse si URL se filtra.

### Opcion B — POST multipart al backend
- Pro: simple, un endpoint.
- Contra: backend proxy 5-20 MB por documento × N prestadores = bandwidth alto + latencia alta + tiempo en Worker (límite CPU).

### Opcion C — TUS protocol o resumable uploads
- Pro: resume de uploads interrumpidos.
- Contra: sobre-ingeniería para MVP (archivos típicamente < 5 MB).

## Decision

Se elige **Opcion A**. Es el patrón estándar de R2/S3 para uploads autenticados sin proxy. El TTL de 600s es suficiente para un upload humano; expiración más larga abre ventana de abuse. El endpoint de confirmación desacopla "el archivo está en R2" de "el backend sabe que está" — importante porque el PUT puede fallar de muchas formas (red, content-type mal).

## Riesgos y mitigaciones

- Riesgo: presigned URL usada por atacante si se filtra → Mitigación: TTL corto (600s), key con prefijo por `verification_id`, content-type bloqueado en whitelist.
- Riesgo: content-type malicioso (`application/x-msdownload`) → Mitigación: whitelist en endpoint que firma: `image/jpeg`, `image/png`, `application/pdf`.
- Riesgo: archivo subido pero confirmación nunca llega → Mitigación: cron (futuro) que limpia filas con `uploaded_at=NULL` y `created_at < NOW() - 1h`. Fuera de scope MVP, documentar.
- Riesgo: R2 vs MinIO con keys distintas → Mitigación: cliente S3-compatible es el mismo; las env vars (`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, etc.) se configuran distinto por ambiente.

## Metrica de exito

- POST `/documents` con kind válido y content-type whitelisted → 200 con `{ upload_url, r2_key, expires_in: 600 }`.
- PUT a `upload_url` con el archivo → 200 y objeto en R2/MinIO.
- POST `/documents/:id/confirm` → 200, fila en `verification_documents` con `uploaded_at` no nulo.
- POST `/documents` sin verificación pendiente → 404.
- POST `/documents` con content-type no whitelisted → 422.
- Tests unit + integración + E2E verde; coverage ≥ 90% en `src/lib/services/storage/r2.ts`.
