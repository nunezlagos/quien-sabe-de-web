import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { eventsLog } from '../../../../database/schema';
import { eq, desc, and } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const GET: APIRoute = async ({ locals, url }) => {
  const user = (locals as any).user;
  if (!user || user.role !== 'admin') return errorResponse('No autorizado', 403);

  const db = getDb(locals);
  const event = url.searchParams.get('event');
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);

  const conditions: any[] = [];
  if (event) conditions.push(eq(eventsLog.event, event as any));

  const items = await db.select()
    .from(eventsLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(eventsLog.createdAt))
    .limit(limit)
    .all();

  return jsonResponse(items);
};
