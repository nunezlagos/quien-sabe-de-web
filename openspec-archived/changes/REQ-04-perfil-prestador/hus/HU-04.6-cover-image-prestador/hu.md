# HU-04.6 — Cover image (hero) del prestador en R2

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-04-perfil-prestador

## Historia de usuario

**Como** prestador
**Quiero** subir una imagen de portada (cover) para mi perfil
**Para** que mi página pública tenga un hero visual atractivo

## Criterios de aceptación (Gherkin)

### Escenario: Upload cover válido
  Dado un prestador con perfil
  Cuando envío `POST /api/v1/providers/me/cover` con `image/jpeg` 4 MB
  Entonces recibo status 200 con `{ "cover_r2_key": "covers/<id>.jpg" }`
  Y existe el objeto en R2/MinIO con dimensiones 1200x400 (16:5 hero)
  Y la fila `providers.cover_r2_key` actualizada

### Escenario: Render como hero en profile.html
  Cuando navego a `/p/:slug`
  Entonces se renderiza el cover como background del header (mockup data: `mockups/js/data.js:25` `coverImage: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?..."`)
  Y el header usa estilo similar a `mockups/verification.html:27-36` (hero con `bg-cover bg-center`, overlay `bg-primary text-white py-16`)

### Escenario: Sin cover → fallback degradé verde
  Dado prestador sin `cover_r2_key`
  Cuando renderizo el perfil
  Entonces el header usa gradient `from-primary to-primary-dark` como fallback

### Escenario: Reemplazo limpia anterior
  Dado prestador con `cover_r2_key="old.jpg"`
  Cuando sube uno nuevo
  Entonces `old.jpg` es eliminado de R2

### Escenario: MIME inválido / tamaño excedido
  Cuando envío `application/pdf` o > 8 MB
  Entonces recibo 415 / 413 respectivamente

## Tareas técnicas

- [ ] Modificar schema Drizzle agregando `providers.cover_r2_key` (text nullable)
- [ ] Migración correspondiente en `src/database/migrations/`
- [ ] Endpoint `src/pages/api/v1/providers/me/cover.ts` (POST)
- [ ] Reuso helper `resizeImage(buffer, w, h)` en `src/lib/services/media/resize.ts`
- [ ] Helper `replaceR2Object(oldKey, newKey)` en `src/lib/services/storage/r2.ts`
- [ ] Modificar `src/pages/p/[slug].astro` para usar cover como hero (referencia `mockups/verification.html:27` para estilo hero)
- [ ] Fallback CSS gradient `bg-gradient-to-r from-primary to-primary-dark` cuando cover_r2_key es null
- [ ] Tests `tests/integration/providers/cover-upload.test.ts`, `tests/e2e/profile-cover-render.spec.ts`
- [ ] Actualizar `mockups/profile.html`: agregar hero section arriba del card de bio (líneas 56-117) con cover image de fondo (`bg-cover bg-center`) + fallback gradient naranja. Estructura: `<div class="hero h-48 bg-gradient-to-br from-primary to-orange-400">` con `<img src="{{cover_url}}" class="w-full h-full object-cover">`.

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
