# HU-23.2 — Upload foto portfolio con resize a R2

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-23-portfolio-prestador

## Historia de usuario

**Como** prestador
**Quiero** subir fotos de mis trabajos
**Para** mostrar mi experiencia a los vecinos

## Criterios de aceptación (Gherkin)

### Escenario: Upload válido genera 800x800 en R2
  Dado prestador con 0-4 imágenes
  Cuando envío `POST /api/v1/providers/me/portfolio` con `image/jpeg` de 3 MB
  Entonces recibo status 201 con `{ id, r2_key, sort_order }`
  Y existe objeto en R2 bucket `media` prefijo `portfolio/<provider_id>/`
  Y la imagen está resizeada a 800x800

### Escenario: Sexta imagen → 409
  Dado prestador con 5 imágenes
  Cuando intento subir otra
  Entonces recibo status 409 con `{ "error": "máximo 5 imágenes" }` (reflejando UI `mockups/dashboard-provider.html:155` "Máx. 5 fotos")

### Escenario: MIME inválido → 415
  Cuando subo `application/pdf`
  Entonces recibo status 415

### Escenario: Archivo > 5 MB → 413
  Cuando subo archivo de 10 MB
  Entonces recibo status 413

### Escenario: sort_order auto incrementa
  Dado prestador con sort_order [0,1]
  Cuando sube una nueva
  Entonces se asigna sort_order=2

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/providers/me/portfolio.ts` (POST multipart)
- [ ] Reuso de `resizeImage(buffer, w, h)` en `src/lib/services/media/resize.ts` (HU-04.3)
- [ ] Servicio `src/lib/services/portfolio/upload.ts` con cálculo de sort_order y validación capacidad
- [ ] Tests `tests/integration/portfolio/upload.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
