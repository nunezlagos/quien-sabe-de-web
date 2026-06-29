# HU-03.1 — Validador puro de RUT chileno

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-03-verificacion-prestador
**Rama:** `feat/HU-03.1-validador-rut-chileno`

## Tareas tecnicas

- [ ] **T1** Implementar `validateRut(input)` en `src/lib/utils/rut.ts` con algoritmo de DV módulo 11, manejo de K, normalización a formato `12345678-K`.
- [ ] **T2** Implementar `normalizeRut(input)` que devuelve el normalized string o `null` si inválido.
- [ ] **T3** Zod schema `rutSchema` en `src/lib/validators/rut.ts` con `.refine()` + `.transform()` que devuelve el normalized.
- [ ] **T4** Exportar tipo `RutValidation` union discriminated.
- [ ] **T5** Tests:
  - [ ] `tests/unit/utils/rut.test.ts` — tabla exhaustiva cubriendo:
    - Formato `12.345.678-5` (con puntos, con guión, DV numérico).
    - Formato `12345678-5` (sin puntos, con guión).
    - Formato `123456785` (sin puntos, sin guión).
    - DV `K` mayúscula y minúscula → normalized siempre K mayúscula.
    - DV incorrecto aleatorio → `dv inválido`.
    - RUT `"ABCDEF"` → `formato inválido`.
    - RUT vacío → `formato inválido`.
    - RUT `"11111111-1"` → válido (todos unos con DV correcto).
    - RUT `"100000000-0"` → `rut fuera de rango`.
    - RUT `"1-9"` → `formato inválido`.

## Sabotaje obligatorio

- [ ] **Sabotaje 1**: en el cálculo del DV esperado, invertir el orden del bucle (recorrer el body sin `.reverse()`) → test con `"12.345.678-5"` debe detectar DV inválido → restaurar (verificar con calculadora online que el algoritmo correcto usa el orden invertido).
- [ ] **Sabotaje 2`: hardcodear `dvExpected = '0'` siempre que `dvNum === 11` (en vez de mapear a `'0'`) → test con RUT cuyo DV esperado es `'0'` (e.g. `"12345678-0"` si el algoritmo da 11) debe validar; si rompe, ajustar caso para que el sabotaje sea detectable.
- [ ] **Sabotaje 3`: quitar el `.toUpperCase()` antes de comparar el DV → test `"9.876.543-k"` (K minúscula) debe detectar `dv inválido` → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/utils/rut.test.ts` → verde
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/lib/utils/rut.ts` y `src/lib/validators/rut.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-03.1-validador-rut-chileno` (no merge a main sin review)
