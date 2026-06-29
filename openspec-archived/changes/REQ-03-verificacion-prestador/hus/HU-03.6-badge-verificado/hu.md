# HU-03.6 — Badge de verificación en perfil público

**Estado:** implementada | **Prioridad:** P1 | **REQ padre:** REQ-03-verificacion-prestador

## Historia de usuario

**Como** visitante anónimo
**Quiero** ver de inmediato que un prestador está verificado
**Para** tener confianza al contactarlo

## Criterios de aceptación (Gherkin)

### Escenario: Perfil verificado muestra badge
  Dado un prestador con `verification.status="verificado"`
  Cuando visito `/p/juan-perez-gasfiter-las-condes`
  Entonces el HTML incluye el componente `<VerifiedBadge />`
  Y el atributo `data-verified="true"` está presente

### Escenario: Perfil sin verificación no muestra badge
  Dado un prestador sin verificación aprobada
  Cuando visito su perfil
  Entonces NO existe el elemento `<VerifiedBadge />` en el DOM

### Escenario: Endpoint de perfil expone `verified` boolean
  Cuando envío `GET /api/v1/providers/juan-perez-gasfiter-las-condes`
  Entonces la respuesta tiene `{ ..., verified: true }`

## Tareas técnicas

- [ ] Componente `src/components/providers/VerifiedBadge.astro`
- [ ] Helper `isVerified(providerId)` que consulta `provider_verifications.status`
- [ ] Extender DTO en `src/pages/api/v1/providers/[idOrSlug].ts`
- [ ] Tests `tests/integration/providers/verified-flag.test.ts`, `tests/e2e/profile-badge.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
