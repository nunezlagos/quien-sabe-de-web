import { describe, it, expect } from 'vitest';
import { slugify } from '../../../src/lib/utils/slug';

describe('slugify', () => {
  it('lowercase and kebab-cases simple names', () => {
    expect(slugify('Las Condes')).toBe('las-condes');
  });

  it('replaces spaces with single hyphen', () => {
    expect(slugify('Paine  Alto')).toBe('paine-alto');
  });

  it('strips diacritics', () => {
    expect(slugify('Ñuñoa')).toBe('nunoa');
    expect(slugify('Peñalolén')).toBe('penalolen');
  });

  it('removes non-alphanumerics except hyphens', () => {
    expect(slugify('San Pedro (RM)')).toBe('san-pedro-rm');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  La Reina  ')).toBe('la-reina');
    expect(slugify('!!!Estación Central!!!')).toBe('estacion-central');
  });

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });
});
