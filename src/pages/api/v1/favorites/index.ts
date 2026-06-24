import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { favorites } from '../../lib/schema';
import { eq, and } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../lib/utils/response';

export const GET: APIRoute = async ({ locals }) => {
  const currentUser = locals.currentUser;
  if (!currentUser) return errorResponse('No autorizado', 401);

  const db = await getDb();
  const userFavorites = await db.select()
    .from(favorites)
    .where(eq(favorites.userId, currentUser.id))
    .all();

  return jsonResponse(userFavorites);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const currentUser = locals.currentUser;
  if (!currentUser) return errorResponse('No autorizado', 401);

  const body = await request.json();
  const tradeId = Number(body.tradeId);
  if (!tradeId) return errorResponse('tradeId requerido', 400);

  const db = await getDb();
  const existing = await db.select()
    .from(favorites)
    .where(and(eq(favorites.userId, currentUser.id), eq(favorites.tradeId, tradeId)))
    .get();

  if (existing) {
    await db.delete(favorites)
      .where(and(eq(favorites.userId, currentUser.id), eq(favorites.tradeId, tradeId)))
      .run();
    return jsonResponse({ favorited: false });
  }

  await db.insert(favorites).values({ userId: currentUser.id, tradeId }).run();
  return jsonResponse({ favorited: true });
};
