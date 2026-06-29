import { getDb } from '../../../database/client';
import { providerAvailability } from '../../../database/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function getAvailability(locals: any, userId: number): Promise<any[]> {
  const db = getDb();
  return db.select().from(providerAvailability)
    .where(eq(providerAvailability.userId, userId))
    .orderBy(providerAvailability.dayOfWeek, providerAvailability.startTime)
    .all();
}

export async function replaceAvailability(locals: any, userId: number, slots: { dayOfWeek: number; startTime: string; endTime: string }[]) {
  const db = getDb();
  await db.delete(providerAvailability).where(eq(providerAvailability.userId, userId)).run();
  if (slots.length > 0) {
    await db.insert(providerAvailability).values(
      slots.map((s) => ({ userId, ...s }))
    ).run();
  }
  return getAvailability(locals, userId);
}

export async function isAvailableNow(locals: any, userId: number): Promise<boolean> {
  const db = getDb();
  const now = new Date();
  const dayOfWeek = now.getDay();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const row = await db.select({ count: sql<number>`COUNT(*)` }).from(providerAvailability)
    .where(and(
      eq(providerAvailability.userId, userId),
      eq(providerAvailability.dayOfWeek, dayOfWeek),
      sql`${providerAvailability.startTime} <= ${timeStr}`,
      sql`${timeStr} < ${providerAvailability.endTime}`
    )).get();

  return (row?.count ?? 0) > 0;
}
