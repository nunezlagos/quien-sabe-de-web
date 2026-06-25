import { describe, it, expect } from 'vitest';
import { hasAnyRole } from '../../../src/lib/services/roles';

describe('hasAnyRole', () => {
  it('retorna true si el rol está en el set', () => {
    expect(hasAnyRole(['user', 'provider'], 'provider')).toBe(true);
  });

  it('retorna false si el rol no está en el set', () => {
    expect(hasAnyRole(['user'], 'provider')).toBe(false);
  });

  it('retorna true si con array OR un rol coincide', () => {
    expect(hasAnyRole(['user'], ['provider', 'admin', 'user'])).toBe(true);
  });

  it('retorna false si con array OR ningún rol coincide', () => {
    expect(hasAnyRole(['user'], ['provider', 'admin'])).toBe(false);
  });

  it('retorna true si el user es admin y se requiere provider o admin', () => {
    expect(hasAnyRole(['user', 'admin'], ['provider', 'admin'])).toBe(true);
  });

  it('retorna false si el set está vacío', () => {
    expect(hasAnyRole([], 'provider')).toBe(false);
  });

  it('retorna false si los required están vacíos', () => {
    expect(hasAnyRole(['user'], [])).toBe(false);
  });
});
