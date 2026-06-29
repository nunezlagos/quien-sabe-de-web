# Propuesta — HU-03.1 — Validador puro de RUT chileno

**Estado:** propuesta | **REQ padre:** REQ-03-verificacion-prestador

## Contexto

REQ-03 exige validar el RUT chileno con dígito verificador antes de aceptar cualquier solicitud de verificación. Esta HU implementa la función pura `validateRut(input)` y un schema Zod `rutSchema` que lo reusa. Es la base sobre la que HU-03.2 monta el formulario y HU-03.5 monta las transiciones: si el RUT es basura, no llegamos a la cola admin. Chile convive con K como DV y con RUTs de personas (sin empresa) y naturales, así que el validador debe aceptar ambos formatos.

## Mockups de referencia

No aplica (HU backend puro, sin UI). El formulario que consume este validador se construye en HU-03.2 (`mockups/verification.html:84-100` es el campo de RUT en la vista).

## Alternativas consideradas

### Opcion A — Función pura + Zod refinement con `validateRut`
- `validateRut(input: string): { valid: boolean; normalized?: string; error?: string }`.
- Acepta formatos `12.345.678-5`, `12345678-5`, `123456785`, `12.345.678-K`, `12345678k` (case-insensitive K).
- Algoritmo: split body + DV, calcular DV esperado con `sum(digit_i * weight_i) mod 11`, comparar.
- Zod `z.string().refine(validateRut, ...)` que rechaza con mensaje claro.
- Pro: función pura = testeable sin DB ni Workers; reusable en backend y frontend.
- Pro: el validador vive en `src/lib/utils/rut.ts`, lo que permite reuso desde cliente (form HU-03.2) sin duplicar lógica.

### Opcion B — Regex + validación server-side separada
- Pro: regex sola detecta formato.
- Contra: NO detecta DV incorrecto (regex solo chequea estructura). La validación de DV es el punto crítico de esta HU.

### Opcion C — Librería externa `rut.js` o `cl-rut`
- Pro: ya escrito.
- Contra: dependencia externa para 30 líneas de código; menos control sobre mensajes de error; aumenta bundle size en frontend.

## Decision

Se elige **Opcion A**. La función pura es 30 líneas, sin dependencias, y testeable con una tabla exhaustiva de casos. La integración con Zod vía `.refine()` mantiene el contrato del resto del proyecto (todos los inputs pasan por Zod antes de tocar DB).

## Riesgos y mitigaciones

- Riesgo: cuerpo del RUT con overflow numérico (e.g. > 99999999) → Mitigación: validar `body <= 99999999` (máximo RUT chileno).
- Riesgo: DV `0` se confunde con `K` (ambos válidos para casos específicos) → Mitigación: algoritmo maneja los dos casos correctamente: `dv = 11 - (sum mod 11)`; si `dv === 11` → `dv = '0'`, si `dv === 10` → `dv = 'K'`.
- Riesgo: input con caracteres no permitidos (`!@#`) → Mitigación: regex previa rechaza con `formato inválido` antes de calcular DV.

## Metrica de exito

- `validateRut("12.345.678-5")` → `{ valid: true, normalized: "12345678-5" }`.
- `validateRut("9.876.543-K")` → `{ valid: true, normalized: "9876543-K" }`.
- `validateRut("12.345.678-0")` → `{ valid: false, error: "dv inválido" }`.
- `validateRut("ABCDEF")` → `{ valid: false, error: "formato inválido" }`.
- `validateRut("11.111.111-1")` → `{ valid: true, normalized: "11111111-1" }` (DV válido, no se rechaza por "todos unos").
- Zod schema rechaza RUT inválido con código 422 en endpoint HU-03.2.
- Tests unit verde; coverage ≥ 90% en `src/lib/utils/rut.ts`.
