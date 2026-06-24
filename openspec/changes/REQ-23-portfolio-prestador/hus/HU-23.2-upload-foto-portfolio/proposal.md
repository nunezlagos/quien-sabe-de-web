# Propuesta — HU-23.2 — Upload foto portfolio con resize a R2

**Estado:** propuesta | **REQ padre:** REQ-23-portfolio-prestador

## Contexto

El prestador necesita subir fotos de sus trabajos desde el dashboard para reforzar credibilidad ante el vecino (OE1). El mockup ya expone el slot de upload con `<input type="file" accept="image/*">` en `mockups/dashboard-provider.html:184`, pero no hay endpoint que reciba, redimensione ni persista la imagen en R2/MinIO.

## Mockups de referencia

- `mockups/dashboard-provider.html:182-185` — botón upload "Add" con `<i class="ri-add-line">` e input file oculto.
- `mockups/dashboard-provider.html:155` — texto "Máx. 5 fotos" que define el límite a devolver en error 409.
- `mockups/dashboard-provider.html:160-171` — card final esperada tras upload exitoso (imagen + delete overlay).
- `mockups/dashboard-provider.html:158` — grid `grid-cols-2 md:grid-cols-5 gap-3`, el aspect ratio sugiere imagen cuadrada (justifica resize 800x800).

## Alternativas consideradas

### Opción A — Upload multipart + resize server-side con `wasm-image-resize`
- Descripción: cliente envía multipart, Worker redimensiona en memoria a 800x800 y escribe en R2.
- Pro: cliente simple, control total del tamaño final, sirve para MinIO en dev.
- Contra: requiere bundle wasm-image-resize (~200 KB), CPU del Worker.

### Opción B — Cloudflare Images / Image Transformations
- Descripción: subir original y servir con `/cdn-cgi/image/`.
- Pro: cero CPU en Worker, transformaciones bajo demanda.
- Contra: feature no disponible localmente en MinIO, vendor lock-in, costo por transformación, contradice el requisito explícito del REQ ("R2 sin transformaciones nativas: usar wasm-image-resize").

### Opción C — Resize en el navegador antes de subir
- Descripción: usar `<canvas>` o `ImageBitmap` y enviar ya redimensionado.
- Pro: cero CPU server.
- Contra: cliente puede saltarse el resize (untrusted), pixel ratio variable entre dispositivos, sin garantía de 800x800 real.

## Decisión

Se adopta la **Opción A**, alineada con el riesgo declarado en el REQ. El resize server-side garantiza que el objeto en R2 siempre mida 800x800 sin confiar en el cliente. Reusa el helper `resizeImage` de HU-04.3 mencionado en `hu.md:41`.

## Riesgos y mitigaciones

- Riesgo: usuario sube archivo enorme (DoS por CPU) → mitigación: límite previo de 5 MB que retorna 413 antes de decodificar.
- Riesgo: MIME spoofing (`image/jpeg` pero contenido HTML) → mitigación: sniff de magic bytes en el servicio antes de pasar a resize.
- Riesgo: race condition entre uploads concurrentes asignando mismo `sort_order` → mitigación: transacción D1 que toma `nextSortOrder` e inserta atómicamente (definido en HU-23.1).
- Riesgo: si la escritura a R2 falla tras escribir D1 (o viceversa) → mitigación: orden estricto "R2 primero, D1 después"; si D1 falla se borra el objeto R2 antes de devolver 500.

## Métrica de éxito

- Subir 5 imágenes válidas devuelve 201 con `{id, r2_key, sort_order}` y existen los 5 objetos en bucket `media` bajo prefijo `portfolio/<provider_id>/`.
- 6º upload devuelve 409 con mensaje espejo del texto UI "máximo 5 imágenes".
- Tests integración pasan contra D1/R2 vía `@cloudflare/vitest-pool-workers`.
