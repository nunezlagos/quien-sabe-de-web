import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../database/client';
import { userViews, trades } from '../../../../../../database/schema';
import { eq, desc } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../../../lib/utils/response';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return errorResponse('No autorizado', 401);

  const db = getDb();
  const items = await db
    .select({
      id: userViews.id,
      tradeId: userViews.tradeId,
      tradeName: trades.name,
      tradeSlug: trades.slug,
      createdAt: userViews.createdAt,
    })
    .from(userViews)
    .innerJoin(trades, eq(userViews.tradeId, trades.id))
    .where(eq(userViews.userId, user.id))
    .orderBy(desc(userViews.createdAt))
    .limit(20)
    .all();

  return jsonResponse(items);
};
