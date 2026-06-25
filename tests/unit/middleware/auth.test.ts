import { describe, it, expect } from 'vitest';
import { hasAnyRole } from '../../../src/lib/services/roles';

describe('requireRole (via hasAnyRole)', () => {
  it('acepta si el rol requerido está en el set', () => {
    expect(hasAnyRole(['user', 'provider'], 'provider')).toBe(true);
  });

  it('rechaza si el rol requerido no está en el set', () => {
    expect(hasAnyRole(['user'], 'provider')).toBe(false);
  });

  it('acepta con array OR cuando al menos un rol coincide', () => {
    expect(hasAnyRole(['user'], ['admin', 'user'])).toBe(true);
  });

  it('rechaza con array OR cuando ningún rol coincide', () => {
    expect(hasAnyRole(['user'], ['admin', 'provider'])).toBe(false);
  });
});
