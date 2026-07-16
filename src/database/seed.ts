import { getDb } from './client';
import { users, communes, trades } from './schema';
import { eq } from 'drizzle-orm';
import { Client } from 'minio';
import { readFile } from 'node:fs/promises';

const COMUNAS = ['Providencia', 'Ñuñoa', 'Maipú', 'La Florida', 'Las Condes', 'Puente Alto'];
const PROVIDERS = ['Juan Pérez', 'María González', 'Pedro Soto', 'Camila Rojas', 'Diego Muñoz', 'Valentina Díaz'];
const OFICIOS = [
  { name: 'Gasfíter', symbol: 'Gasfitería', category: 'hogar', price: 25000 },
  { name: 'Electricista', symbol: 'Electricidad', category: 'hogar', price: 30000 },
  { name: 'Carpintero', symbol: 'Carpintería', category: 'hogar', price: 28000 },
  { name: 'Pintor', symbol: 'Pintura', category: 'hogar', price: 22000 },
  { name: 'Cerrajero', symbol: 'Cerrajería', category: 'hogar', price: 20000 },
  { name: 'Jardinero', symbol: 'Jardinería', category: 'hogar', price: 18000 },
  { name: 'Técnico PC', symbol: 'Computación', category: 'tecnologia', price: 15000 },
  { name: 'Técnico Celulares', symbol: 'Reparación', category: 'tecnologia', price: 12000 },
  { name: 'Mecánico', symbol: 'Mecánica', category: 'automotriz', price: 35000 },
  { name: 'Gomería', symbol: 'Neumáticos', category: 'automotriz', price: 10000 },
  { name: 'Profesor de Matemáticas', symbol: 'Educación', category: 'educacion', price: 14000 },
  { name: 'Profesora de Inglés', symbol: 'Idiomas', category: 'educacion', price: 16000 },
  { name: 'Peluquero', symbol: 'Peluquería', category: 'salud_belleza', price: 12000 },
  { name: 'Manicurista', symbol: 'Manicura', category: 'salud_belleza', price: 11000 },
  { name: 'Maestro Multioficio', symbol: 'General', category: 'otros', price: 24000 },
];
const TOTAL = 30;
const UNIQUE_IMAGES = 40;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function seedCommunes(db: ReturnType<typeof getDb>): Promise<number[]> {
  const ids: number[] = [];
  for (const name of COMUNAS) {
    const slug = slugify(name);
    let row = await db.select({ id: communes.id }).from(communes).where(eq(communes.slug, slug)).get();
    if (!row) {
      await db.insert(communes).values({ name, slug, region: 'Metropolitana' }).run();
      row = await db.select({ id: communes.id }).from(communes).where(eq(communes.slug, slug)).get();
    }
    ids.push(row.id);
  }
  return ids;
}

async function seedProviders(db: ReturnType<typeof getDb>): Promise<number[]> {
  const ids: number[] = [];
  for (let i = 0; i < PROVIDERS.length; i++) {
    const email = `provider${i}@demo.quiensabe.cl`;
    let row = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
    if (!row) {
      await db.insert(users).values({ email, name: PROVIDERS[i], role: 'provider', emailVerified: true }).run();
      row = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
    }
    ids.push(row.id);
  }
  return ids;
}

export const seed = async () => {
  const db = getDb();
  const bucket = process.env.MINIO_BUCKET || 'quien-sabe-files';
  const minio = new Client({
    endPoint: process.env.MINIO_ENDPOINT || 'minio',
    port: Number(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  });
  // URL host-reachable por el navegador (el bucket es anonymous download)
  const hostBase = `http://localhost:9002/${bucket}/oficios`;

  const communeIds = await seedCommunes(db);
  const providerIds = await seedProviders(db);

  let created = 0;
  for (let i = 0; i < TOTAL; i++) {
    const slug = `oficio-demo-${String(i).padStart(2, '0')}`;
    const existing = await db.select({ id: trades.id }).from(trades).where(eq(trades.slug, slug)).get();
    if (existing) continue;

    const key = `oficios/${String(i).padStart(2, '0')}.webp`;
    const source = `${process.cwd()}/public/images/collage/${String(i % UNIQUE_IMAGES).padStart(3, '0')}.webp`;
    const buffer = await readFile(source);
    await minio.putObject(bucket, key, buffer, buffer.length, { 'Content-Type': 'image/webp' });

    const oficio = OFICIOS[i % OFICIOS.length];
    await db.insert(trades).values({
      userId: providerIds[i % providerIds.length],
      symbol: oficio.symbol,
      name: oficio.name,
      slug,
      category: oficio.category as 'hogar' | 'tecnologia' | 'automotriz' | 'educacion' | 'salud_belleza' | 'otros',
      description: `${oficio.name} con experiencia en tu barrio. Trabajo garantizado y atención rápida.`,
      basePriceClp: oficio.price + (i % 5) * 2000,
      imageUrl: `${hostBase}/${String(i).padStart(2, '0')}.webp`,
      verified: i % 3 === 0,
      availableNow: i % 2 === 0,
      communeId: communeIds[i % communeIds.length],
      status: 'active',
    }).run();
    created++;
  }

  return { message: `Seed OK: ${created} oficios nuevos de ${TOTAL}`, communes: communeIds.length, providers: providerIds.length };
};
