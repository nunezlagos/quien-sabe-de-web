import type { APIRoute } from 'astro';
import { getDb } from '../../../../../lib/db';
import { reviews, trades } from '../../../../../lib/schema';
import { errorResponse, jsonResponse } from '../../../../../lib/utils/response';
import { eq, and } from 'drizzle-orm';

export const POST: APIRoute = async ({ params, request, locals }) => {
  const db = await getDb();
  const currentUser = locals.currentUser;
  if (!currentUser) return errorResponse('No autorizado', 401);
  if (currentUser.role !== 'provider') return errorResponse('Solo prestadores', 403);

  const reviewId = Number(params.id);
  if (isNaN(reviewId)) return errorResponse('ID inválido', 400);

  const body = await request.json();
  const response = String(body.response || '').trim();
  if (!response) return errorResponse('La respuesta no puede ir vacía', 400);

  const review = await db.select()
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .get();

  if (!review) return errorResponse('Reseña no encontrada', 404);

  const trade = await db.select()
    .from(trades)
    .where(and(eq(trades.id, review.tradeId), eq(trades.userId, currentUser.id)))
    .get();

  if (!trade) return errorResponse('Esta reseña no es para un oficio tuyo', 403);

  await db.update(reviews)
    .set({ response, respondedAt: new Date() })
    .where(eq(reviews.id, reviewId))
    .run();

  return jsonResponse({ ok: true });
};
