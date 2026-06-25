import { describe, it, expect } from 'vitest';
import { normalizeRut, validateRut } from '../../../src/lib/utils/rut';

describe('normalizeRut', () => {
  it('normaliza con puntos y guión', () => {
    expect(normalizeRut('12.345.678-5')).toBe('12345678-5');
  });

  it('normaliza sin puntos', () => {
    expect(normalizeRut('12345678-5')).toBe('12345678-5');
  });

  it('convierte k minúscula a K mayúscula', () => {
    expect(normalizeRut('9876543-k')).toBe('9876543-K');
  });

  it('elimina espacios', () => {
    expect(normalizeRut(' 12.345.678-5 ')).toBe('12345678-5');
  });
});

describe('validateRut', () => {
  it('acepta RUT 12.345.678-5 (módulo 11 correcto)', () => {
    const r = validateRut('12.345.678-5');
    expect(r).toEqual({ valid: true, normalized: '12345678-5' });
  });

  it('acepta RUT 11.111.111-1 (módulo 11 correcto)', () => {
    const r = validateRut('11.111.111-1');
    expect(r).toEqual({ valid: true, normalized: '11111111-1' });
  });

  it('acepta RUT 7 dígitos 1.234.567-4 (persona natural)', () => {
    const r = validateRut('1.234.567-4');
    expect(r).toEqual({ valid: true, normalized: '1234567-4' });
  });

  it('rechaza RUT 12.345.678-0 (dv incorrecto)', () => {
    const r = validateRut('12.345.678-0');
    expect(r).toEqual({ valid: false, error: 'dv inválido' });
  });

  it('rechaza RUT 12.345.678-9 (dv incorrecto)', () => {
    const r = validateRut('12.345.678-9');
    expect(r).toEqual({ valid: false, error: 'dv inválido' });
  });

  it('rechaza RUT con letras', () => {
    const r = validateRut('ABCDEF');
    expect(r).toEqual({ valid: false, error: 'formato inválido' });
  });

  it('rechaza RUT sin guión', () => {
    const r = validateRut('123456789');
    expect(r).toEqual({ valid: false, error: 'formato inválido' });
  });

  it('rechaza RUT vacío', () => {
    const r = validateRut('');
    expect(r).toEqual({ valid: false, error: 'formato inválido' });
  });

  it('rechaza RUT k minúscula con dv incorrecto igual falla', () => {
    const r = validateRut('9.876.543-k');
    expect(r).toEqual({ valid: false, error: 'dv inválido' });
  });
});
