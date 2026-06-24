import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDb } from '../../_helpers/in-memory-db';
import { listCommunes, seedCommunes } from '../../../src/lib/services/communes';
import type { CommuneInsert } from '../../../src/lib/services/communes';
import { communes } from '../../../src/database/schema';

const sampleData: CommuneInsert[] = [
  { name: 'Las Condes', region: 'Metropolitana' },
  { name: 'Ñuñoa', region: 'Metropolitana' },
  { name: 'Providencia', region: 'Metropolitana' },
];

describe('listCommunes', () => {
  beforeEach(async () => {
    const db = createInMemoryDb();
    await seedCommunes(db, sampleData);
  });

  it('returns all communes when q is omitted', async () => {
    const db = createInMemoryDb();
    await seedCommunes(db, sampleData);
    const result = await listCommunes(db);
    expect(result).toHaveLength(3);
  });

  it('matches case-insensitively by name', async () => {
    const db = createInMemoryDb();
    await seedCommunes(db, sampleData);
    const result = await listCommunes(db, 'las condes');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'Las Condes', slug: 'las-condes' });
  });

  it('matches case-insensitively on partial text', async () => {
    const db = createInMemoryDb();
    await seedCommunes(db, sampleData);
    const result = await listCommunes(db, 'PROVI');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Providencia');
  });

  it('returns empty array when no match', async () => {
    const db = createInMemoryDb();
    await seedCommunes(db, sampleData);
    const result = await listCommunes(db, 'inexistente');
    expect(result).toEqual([]);
  });

  it('returns id, name and slug fields', async () => {
    const db = createInMemoryDb();
    await seedCommunes(db, [{ name: 'Santiago', region: 'Metropolitana' }]);
    const result = await listCommunes(db);
    expect(Object.keys(result[0]).sort()).toEqual(['id', 'name', 'slug']);
  });
});

describe('seedCommunes idempotency', () => {
  it('does not duplicate rows when seeded twice', async () => {
    const db = createInMemoryDb();
    const data: CommuneInsert[] = Array.from({ length: 52 }, (_, i) => ({
      name: `Comuna ${i + 1}`,
      region: 'Metropolitana',
    }));
    await seedCommunes(db, data);
    await seedCommunes(db, data);
    const all = await db.select().from(communes).all();
    expect(all).toHaveLength(52);
  });

  it('keeps exactly 52 rows for the full RM dataset', async () => {
    const db = createInMemoryDb();
    const data: CommuneInsert[] = Array.from({ length: 52 }, (_, i) => ({
      name: `RM ${i + 1}`,
      region: 'Metropolitana',
    }));
    await seedCommunes(db, data);
    const all = await db.select().from(communes).all();
    expect(all).toHaveLength(52);
  });
});
