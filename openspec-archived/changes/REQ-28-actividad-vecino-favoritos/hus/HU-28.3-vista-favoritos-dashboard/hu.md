# HU-28.3 — Sección Vecinos Guardados en dashboard-user

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-28-actividad-vecino-favoritos

## Historia de usuario

**Como** vecino
**Quiero** ver y contactar rápidamente a mis favoritos
**Para** reusar prestadores de confianza

## Criterios de aceptación (Gherkin)

### Escenario: Render fiel al mockup
  Cuando navego a `/dashboard-user`
  Entonces la sección "Vecinos Guardados" (`mockups/dashboard-user.html:91-117`) se popula desde `GET /api/v1/users/me/favorites`
  Y cada item respeta el HTML del mockup: avatar circular con inicial (línea 97), nombre + badge oficio coloreado (línea 99-101), botón WhatsApp verde redondo (línea 103)

### Escenario: Lista vacía
  Cuando no tengo favoritos
  Entonces aparece estado vacío "Aún no has guardado vecinos" + CTA "Buscar"

### Escenario: Botón WhatsApp link directo
  Cuando hago clic en el botón verde
  Entonces se abre WhatsApp con `wa.me/<phone>` (REQ-08 tracking)

### Escenario: Quitar favorito desde dashboard
  Cuando hago clic en avatar y elijo "Quitar"
  Entonces se llama DELETE y la card desaparece sin recargar

### Escenario: Avatares
  Cuando el prestador tiene foto R2
  Entonces se muestra `<img>` en vez de inicial; si no, fallback a primera letra del nombre (estilo `bg-white text-primary font-bold` del mockup línea 97)

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/users/me/favorites.ts` (GET listado)
- [ ] Componente `<FavoritesList />` en `src/components/activity/FavoritesList.astro` portando HTML del mockup
- [ ] Insertar en `src/pages/dashboard-user.astro` reemplazando datos hardcoded
- [ ] Wire del botón WhatsApp con REQ-08 tracking
- [ ] Tests E2E `tests/e2e/favorites-dashboard.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
