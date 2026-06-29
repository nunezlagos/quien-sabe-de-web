import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../database/client';
import { reviews, adminAuditLog } from '../../../../../../database/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../../../lib/utils/response';
import * as z from 'zod/v4';

const hideSchema = z.object({
  reason: z.string().min(10, 'El motivo debe tener al menos 10 caracteres').max(500),
});

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const user = (locals as any).user;
  if (!user || user.role !== 'admin') return errorResponse('No autorizado', 403);

  const reviewId = Number(params.id);
  if (!reviewId) return errorResponse('ID inválido', 400);

  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  const parsed = hideSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map(i => i.message).join(', '), 422);

  const db = getDb();
  const review = await db.select().from(reviews).where(eq(reviews.id, reviewId)).get();
  if (!review) return errorResponse('Reseña no encontrada', 404);

  await db.update(reviews).set({ body: '[ocultada por moderación]', rating: 0 }).where(eq(reviews.id, reviewId)).run();
  await db.insert(adminAuditLog).values({
    adminId: user.id,
    action: 'review_hidden',
    entityType: 'review',
    entityId: reviewId,
    details: JSON.stringify({ reason: parsed.data.reason, originalBody: review.body.slice(0, 100) }),
  }).run();

  return jsonResponse({ ok: true });
};
