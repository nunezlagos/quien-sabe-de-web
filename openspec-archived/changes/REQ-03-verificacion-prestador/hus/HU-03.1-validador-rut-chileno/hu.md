# HU-03.1 — Validador puro de RUT chileno

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-03-verificacion-prestador

## Historia de usuario

**Como** sistema
**Quiero** validar un RUT chileno con dígito verificador
**Para** rechazar formatos inválidos antes de tocar la base

## Criterios de aceptación (Gherkin)

### Escenario: RUT con formato 12.345.678-9 válido
  Cuando llamo `validateRut("12.345.678-5")`
  Entonces el resultado es `{ valid: true, normalized: "12345678-5" }`

### Escenario: RUT con K en mayúscula
  Cuando llamo `validateRut("9.876.543-K")`
  Entonces `valid: true` y `normalized` queda con K mayúscula

### Escenario: RUT con DV incorrecto
  Cuando llamo `validateRut("12.345.678-0")`
  Entonces `{ valid: false, error: "dv inválido" }`

### Escenario: RUT con basura como letras
  Cuando llamo `validateRut("ABCDEF")`
  Entonces `{ valid: false, error: "formato inválido" }`

### Escenario: Zod schema rechaza RUT inválido en endpoint
  Cuando envío `POST /api/v1/providers/me/verification` con `rut: "11.111.111-1"`
  Entonces recibo status 422 con detalle del campo `rut`

## Tareas técnicas

- [ ] Función pura `validateRut(input)` en `src/lib/utils/rut.ts`
- [ ] Helper `normalizeRut(input)` (quita puntos, conserva guión, K en mayúscula)
- [ ] Zod refinement `rutSchema` en `src/lib/validators/rut.ts`
- [ ] Tests `tests/unit/utils/rut.test.ts` con tabla exhaustiva de casos

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
