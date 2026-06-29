# Diseno tecnico — HU-03.1 — Validador puro de RUT chileno

**REQ padre:** REQ-03-verificacion-prestador

## Modelo de datos

Sin cambios. Esta HU es backend puro sin persistencia.

## Contrato de API

No aplica (función de utilidad + schema Zod consumidos por HU-03.2 y HU-03.5).

## Validaciones Zod

```ts
// src/lib/validators/rut.ts
import { z } from 'zod'
import { validateRut } from '../utils/rut'

export const rutSchema = z.string().refine(
  (v) => {
    const r = validateRut(v)
    return r.valid
  },
  (v) => {
    const r = validateRut(v as string)
    return { message: r.error ?? 'rut inválido' }
  }
).transform((v) => validateRut(v).normalized!)
```

```ts
// src/lib/utils/rut.ts
export type RutValidation =
  | { valid: true; normalized: string }
  | { valid: false; error: 'formato inválido' | 'dv inválido' | 'rut fuera de rango' }

export function validateRut(input: string): RutValidation
export function normalizeRut(input: string): string | null  // devuelve normalized o null
```

## Componentes UI

No aplica directamente. El formulario en HU-03.2 (`mockups/verification.html:84-100`) usa `rutSchema` o un wrapper equivalente en cliente.

## Flujo de interaccion (secuencial)

1. Input del usuario en `<input name="rut">`.
2. Frontend aplica `validateRut` (mismo helper, importado en cliente) para feedback inmediato antes de submit.
3. Submit → backend valida con `rutSchema` (Zod) → si falla, 422 con detalle.

## Capa de servicios

```ts
// src/lib/utils/rut.ts (pseudocodigo)
export function validateRut(input: string): RutValidation {
  // 1. Sanitizar: trim, uppercase K
  // 2. Regex formato: /^(\d{1,2}\.?\d{3}\.?\d{3})-?([\dK])$/i
  // 3. Separar body y DV
  // 4. Limpiar puntos del body, parsear a int
  // 5. Si body > 99999999 → return { valid: false, error: 'rut fuera de rango' }
  // 6. Calcular DV esperado:
  //    let sum = 0; let factor = 2;
  //    for (const digit of body.reverse()) { sum += digit * factor; factor = factor === 7 ? 2 : factor + 1 }
  //    const dvNum = 11 - (sum % 11)
  //    const dvExpected = dvNum === 11 ? '0' : dvNum === 10 ? 'K' : String(dvNum)
  // 7. Comparar dvExpected con dvInput (case-insensitive)
  // 8. Si match → return { valid: true, normalized: '<body>-<dvExpected>' }
  // 9. Si no → return { valid: false, error: 'dv inválido' }
}
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/utils/rut.test.ts` | Tabla exhaustiva de casos |

Casos de la tabla:
- `"12.345.678-5"` → válido, normalized `"12345678-5"`.
- `"12345678-5"` (sin puntos) → válido, normalized igual.
- `"123456785"` (sin guión) → válido, normalized `"12345678-5"`.
- `"9.876.543-K"` → válido, K mayúscula.
- `"9.876.543-k"` → válido, normalized `"9876543-K"` (K mayúscula).
- `"12.345.678-0"` → inválido, `dv inválido`.
- `"ABCDEF"` → inválido, `formato inválido`.
- `""` → inválido, `formato inválido`.
- `"12345678-9"` (DV inválido aleatorio) → inválido, `dv inválido`.
- `"11111111-1"` → válido (DV calculado coincide).
- `"99999999-9"` → válido (límite superior).
- `"100000000-0"` → inválido, `rut fuera de rango`.
- `"1-9"` → inválido, `formato inválido` (body demasiado corto).

## Dependencias y secuencia

- **Bloqueado por:** — (utilidad pura).
- **Bloquea a:** HU-03.2 (form), HU-03.5 (PATCH endpoint).
- **Recursos compartidos:** `src/lib/utils/rut.ts` (importable desde cliente y servidor — código sin imports de runtime específico).

## Riesgos tecnicos

- Riesgo: el algoritmo de DV se calcula mal off-by-one → Mitigación: tabla de tests exhaustiva con RUTs conocidos (los del Servicio de Impuestos Internos).
- Riesgo: `Number(body)` pierde precisión para RUTs de 8 dígitos con punto → Mitigación: mantener body como string hasta el cálculo; el bucle multiplica char por char.
- Riesgo: el helper se usa en cliente y servidor → Mitigación: el archivo no debe importar nada específico de Workers/Astro/Node; solo tipos built-in. Documentar en comentario de cabecera.
