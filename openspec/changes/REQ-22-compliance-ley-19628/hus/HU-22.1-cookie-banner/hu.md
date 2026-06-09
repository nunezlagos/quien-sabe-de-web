# HU-22.1 — Cookie banner inicial con elección persistida

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-22-compliance-ley-19628

## Historia de usuario

**Como** visitante
**Quiero** decidir qué cookies acepto al ingresar
**Para** ejercer mi derecho de protección de datos

## Criterios de aceptación (Gherkin)

### Escenario: Primera visita muestra banner
  Dado un visitante sin cookie `qs_consent`
  Cuando carga cualquier ruta
  Entonces se renderiza banner sticky-bottom con 3 botones: "Aceptar todo", "Sólo necesarias", "Configurar"
  Y el banner sigue el estilo `bg-white shadow-lg border border-gray-100 rounded-2xl` (paleta consistente con `mockups/about.html`)

### Escenario: Aceptar todo persiste decisión
  Cuando hago clic en "Aceptar todo"
  Entonces se setea cookie `qs_consent` firmada con `{ analytics:true, communications:true, public_profile:true }`
  Y el banner desaparece
  Y POST `/api/v1/consent/cookies` registra elección

### Escenario: Sólo necesarias deshabilita analytics
  Cuando elijo "Sólo necesarias"
  Entonces el cliente NO inicializa REQ-18 analytics
  Y consent.analytics=false

### Escenario: Configurar abre modal granular
  Cuando hago clic en "Configurar"
  Entonces se abre modal con toggles por finalidad

## Tareas técnicas

- [ ] Componente `<CookieBanner />` en `src/components/legal/CookieBanner.astro`
- [ ] Inyectar en `src/layouts/Layout.astro` (raíz del proyecto)
- [ ] Endpoint `src/pages/api/v1/consent/cookies.ts` (POST público) que persiste opcionalmente si user logueado
- [ ] Cookie firmada HMAC en `src/lib/utils/signed-cookie.ts`
- [ ] Tests E2E `tests/e2e/cookie-banner.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
