# Propuesta — HU-15.6 — Boletas adjuntas en R2 con link público firmado

**Estado:** propuesta | **REQ padre:** REQ-15-transparencia-publica

## Contexto

El compromiso de transparencia (OE3) no se cumple solo con cifras: cada gasto debe poder respaldarse con la boleta/factura emitida por el proveedor. Esta HU habilita al admin a subir esos PDFs/imágenes a R2 y a exponerlos en `/transparency` mediante URLs firmadas con TTL corto, sin filtrar la key real del objeto.

## Mockups de referencia

- `mockups/transparency.html:81` — celda con `<a href="#" class="text-blue-500 hover:underline">Ver Boleta</a>` que materializa el link público al documento.
- `mockups/transparency.html:87` — variante "Ver Factura" (mismo componente, distinto texto).
- `mockups/transparency.html:93` — variante sin documento: `<span class="text-gray-400 text-xs italic">Donación directa</span>`.
- `mockups/dashboard-admin.html:268-274` — sección Finanzas donde el `ExpenseFormModal` (HU-15.2) tendrá el botón "Adjuntar documento". UI a diseñar siguiendo este estilo.

## Alternativas consideradas

### Opción A — Presigned PUT directo a R2 + PATCH al expense
- Admin solicita presigned URL al backend → sube directo a R2 → confirma con PATCH que asocia `document_r2_key`.
- Pro: el Worker no maneja el binario (ahorra CPU/memoria), funciona con archivos grandes, patrón estándar S3.
- Contra: dos requests; admin ve loader mientras se completa el flujo.

### Opción B — Upload por proxy a través del Worker
- Admin POSTea multipart al Worker, el Worker stream-uploadea a R2.
- Pro: una sola request, control total sobre validación de content-type y tamaño.
- Contra: consume CPU/memoria del Worker, riesgo de timeout en archivos grandes, complica testing.

### Opción C — Sin documentos adjuntos, solo nota textual
- Eliminar el feature; mantener `note` como referencia.
- Pro: cero complejidad.
- Contra: viola la promesa de transparencia "boletas verificables" del `req.md:18`.

## Decisión

Se elige Opción A. El presigned upload es el patrón estándar y el proyecto ya tiene un helper `signGetUrl` reusable según `hu.md:31`. Permite validar tipo/tamaño en el momento de generar la presigned URL (firmando `Content-Type` y `Content-Length`) sin que el binario pase por el Worker.

## Riesgos y mitigaciones

- Riesgo: admin sube un binario malicioso (ejecutable, HTML con XSS) y visitantes lo abren → Mitigación: validar `Content-Type` permitido (`application/pdf`, `image/png`, `image/jpeg`) al firmar la presigned URL; forzar `Content-Disposition: inline` solo para PDFs/imágenes, `attachment` para otros.
- Riesgo: presigned URL filtrada permite descarga eterna → Mitigación: TTL 1 h ya especificado por `hu.md:22`. Renderizar lazy: el link "Ver Boleta" pide la URL on-click, no en el HTML inicial.
- Riesgo: `document_r2_key` apunta a un objeto inexistente (subida abortada) → Mitigación: el endpoint que sirve la URL firmada hace `HEAD` previo y responde 404 si no existe.
- Riesgo: visitante ve link a un expense que admin marcó como sin documento → Mitigación: HU-15.3 ya garantiza que `has_document=false` no renderiza enlace (escenario Gherkin "Documento no existe → 404 sin filtración").
- Riesgo: bucket público accidentalmente expuesto → Mitigación: bucket R2 sigue siendo privado; solo URLs firmadas dan acceso.

## Métrica de éxito

- Admin completa flujo crear-gasto + adjuntar-documento en menos de 30 s en condiciones normales.
- Visitante anónimo hace click en "Ver Boleta" y descarga/visualiza el archivo en menos de 2 s.
- Expense sin documento NO renderiza el enlace (solo el texto "Donación directa" o equivalente).
- Test de integración valida que el presigned URL caduca a la hora.
