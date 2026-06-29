import type { APIRoute } from 'astro';
import { getDb } from '../../../../../database/client';
import { portfolioImages, trades } from '../../../../../database/schema';
import { eq, and, asc, count, sql } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../../lib/utils/response';

export const GET: APIRoute = async ({ params, locals }) => {
  const tradeId = Number(params.tradeId);
  if (!tradeId) return errorResponse('tradeId requerido', 400);

  const db = getDb();
  const images = await db.select()
    .from(portfolioImages)
    .where(eq(portfolioImages.tradeId, tradeId))
    .orderBy(asc(portfolioImages.sortOrder))
    .all();

  return jsonResponse(images);
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  const user = (locals as any).user;
  if (!user) return errorResponse('No autorizado', 401);
  if (user.role !== 'provider' && user.role !== 'admin') return errorResponse('Solo prestadores', 403);

  const tradeId = Number(params.tradeId);
  const db = getDb();

  const trade = await db.select().from(trades).where(and(eq(trades.id, tradeId), eq(trades.userId, user.id))).get();
  if (!trade && user.role !== 'admin') return errorResponse('Oficio no encontrado', 404);

  const formData = await request.formData();
  const file = formData.get('image') as File | null;
  const caption = String(formData.get('caption') || '').trim() || null;

  if (!file || file.size === 0) return errorResponse('Selecciona una imagen', 400);
  if (file.size > 5 * 1024 * 1024) return errorResponse('Max 5MB', 400);

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  const countResult = await db.select({ c: count() }).from(portfolioImages).where(eq(portfolioImages.tradeId, tradeId)).get();
  const nextOrder = (countResult?.c ?? 0);

  await db.insert(portfolioImages).values({
    tradeId, url: dataUrl, caption, sortOrder: nextOrder,
  }).run();

  return jsonResponse({ ok: true });
};
