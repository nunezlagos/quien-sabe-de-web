export function normalizeRut(input: string): string {
  return input.replace(/\./g, '').trim().toUpperCase();
}

export function validateRut(input: string): { valid: true; normalized: string } | { valid: false; error: string } {
  const normalized = normalizeRut(input);
  const match = normalized.match(/^(\d{1,8})-([\dkK])$/);
  if (!match) return { valid: false, error: 'formato inválido' };

  const cuerpo = match[1];
  const dvIngresado = match[2].toUpperCase();
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = suma % 11;
  const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : String(11 - resto);

  if (dvCalculado !== dvIngresado) return { valid: false, error: 'dv inválido' };
  return { valid: true, normalized };
}
