import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../database/client';
import { reviews, trades } from '../../../../../../database/schema';
import { eq, desc } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../../../lib/utils/response';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return errorResponse('No autorizado', 401);

  const db = getDb();
  const items = await db
    .select({
      id: reviews.id,
      tradeId: reviews.tradeId,
      tradeName: trades.name,
      tradeSlug: trades.slug,
      rating: reviews.rating,
      body: reviews.body,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(trades, eq(reviews.tradeId, trades.id))
    .where(eq(reviews.userId, user.id))
    .orderBy(desc(reviews.createdAt))
    .limit(50)
    .all();

  return jsonResponse(items);
};
