import * as z from 'zod';

function validateRut(rut: string): boolean {
  const clean = rut.replace(/[^0-9kK]/g, '');
  if (clean.length < 2) return false;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();

  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }

  const expected = (11 - (sum % 11)).toString();
  const expectedChar = expected === '11' ? '0' : expected === '10' ? 'K' : expected;

  return expectedChar === dv;
}

export const SolicitudVerificacionCuerpo = z.object({
  rut: z
    .string()
    .trim()
    .regex(/^[0-9]{7,8}-[0-9kK]$/, 'RUT inválido (formato 12345678-9)')
    .refine(validateRut, 'RUT inválido (dígito verificador incorrecto)'),
  trade: z.string().trim().min(1, 'Selecciona un oficio'),
});
