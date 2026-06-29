import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../database/client';
import { contactEvents, trades } from '../../../../../../database/schema';
import { eq, desc } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../../../lib/utils/response';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return errorResponse('No autorizado', 401);

  const db = getDb();
  const events = await db
    .select({
      id: contactEvents.id,
      eventType: contactEvents.eventType,
      tradeId: contactEvents.tradeId,
      tradeName: trades.name,
      tradeSlug: trades.slug,
      createdAt: contactEvents.createdAt,
    })
    .from(contactEvents)
    .innerJoin(trades, eq(contactEvents.tradeId, trades.id))
    .where(eq(contactEvents.userId, user.id))
    .orderBy(desc(contactEvents.createdAt))
    .limit(50)
    .all();

  return jsonResponse(events);
};
