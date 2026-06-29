import type { APIRoute } from 'astro';
import { getDb } from '../../../../../database/client';
import { reviews, trades } from '../../../../../database/schema';
import { errorResponse, jsonResponse } from '../../../../../lib/utils/response';
import { eq, and } from 'drizzle-orm';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const db = getDb();
  const currentUser = locals.user;
  if (!currentUser) return errorResponse('No autorizado', 401);

  const reviewId = Number(params.id);
  if (isNaN(reviewId)) return errorResponse('ID inválido', 400);

  const body = await request.json();
  const { body: newBody, rating } = body;

  const review = await db.select()
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .get();

  if (!review) return errorResponse('Reseña no encontrada', 404);
  if (!review.createdAt) return errorResponse('Reseña sin fecha de creación', 500);

  const editableUntil = new Date(review.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (new Date() > editableUntil) return errorResponse('Solo se puede editar dentro de 7 días', 403);

  const updates: Record<string, unknown> = {};
  if (newBody !== undefined) updates.body = String(newBody).trim();
  if (rating !== undefined) updates.rating = Number(rating);

  if (Object.keys(updates).length === 0) return errorResponse('Nada que actualizar', 400);

  await db.update(reviews)
    .set(updates)
    .where(eq(reviews.id, reviewId))
    .run();

  return jsonResponse({ ok: true });
};
