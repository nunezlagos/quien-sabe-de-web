import { sql, asc } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from '../../database/schema';
import { communes } from '../../database/schema';
import { slugify } from '../utils/slug';

export type CommuneDb = DrizzleD1Database<typeof schema> | BunSQLiteDatabase<typeof schema>;

export type CommuneInsert = {
  name: string;
  region?: string;
};

export type CommuneRow = {
  id: number;
  name: string;
  slug: string;
};

const projection = { id: communes.id, name: communes.name, slug: communes.slug };

export async function listCommunes(db: CommuneDb, q?: string): Promise<CommuneRow[]> {
  if (q && q.trim().length > 0) {
    const needle = `%${q.trim().toLowerCase()}%`;
    return await db
      .select(projection)
      .from(communes)
      .where(sql`lower(${communes.name}) LIKE ${needle}`)
      .orderBy(asc(communes.name))
      .all();
  }

  return await db.select(projection).from(communes).orderBy(asc(communes.name)).all();
}

export async function seedCommunes(db: CommuneDb, data: CommuneInsert[]): Promise<void> {
  if (data.length === 0) return;

  const rows = data.map((c) => ({
    name: c.name,
    slug: slugify(c.name),
    region: c.region ?? 'Metropolitana',
  }));

  await db.insert(communes).values(rows).onConflictDoNothing({ target: communes.slug }).run();
}
