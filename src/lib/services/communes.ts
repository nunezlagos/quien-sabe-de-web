import { sql, asc } from 'drizzle-orm';
import { communes } from '../../database/schema';
import { slugify } from '../utils/slug';

export type CommuneRow = {
  id: number;
  name: string;
  slug: string;
};

export type CommuneInsert = {
  name: string;
  region?: string;
};

const projection = { id: communes.id, name: communes.name, slug: communes.slug };

export async function listCommunes(db: any, q?: string): Promise<CommuneRow[]> {
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

export async function seedCommunes(db: any, data: CommuneInsert[]): Promise<void> {
  if (data.length === 0) return;

  const rows = data.map((c) => ({
    name: c.name,
    slug: slugify(c.name),
    region: c.region ?? 'Metropolitana',
  }));

  // MySQL: inserción idempotente. slug es UNIQUE; ante colisión no-op (deja el id igual).
  await db.insert(communes).values(rows).onDuplicateKeyUpdate({ set: { id: sql`id` } }).run();
}
