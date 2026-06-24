import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { appSettings } from '../../../../lib/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const GET: APIRoute = async ({ locals }) => {
  const u = locals.currentUser;
  if (!u || u.role !== 'admin') return errorResponse('No autorizado', 401);

  const db = await getDb();
  const rows = await db.select().from(appSettings).all();
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  return jsonResponse(settings);
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  const u = locals.currentUser;
  if (!u || u.role !== 'admin') return errorResponse('No autorizado', 401);

  const body = await request.json();
  const db = await getDb();

  for (const [key, value] of Object.entries(body)) {
    const existing = await db.select().from(appSettings).where(eq(appSettings.key, key)).get();
    if (existing) {
      await db.update(appSettings).set({ value: String(value), updatedAt: new Date() }).where(eq(appSettings.key, key)).run();
    } else {
      await db.insert(appSettings).values({ key, value: String(value) }).run();
    }
  }

  return jsonResponse({ ok: true });
};
