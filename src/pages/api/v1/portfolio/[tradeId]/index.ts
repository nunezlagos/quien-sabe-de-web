import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { portfolioImages, trades } from '../../../lib/schema';
import { eq, and, asc } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../lib/utils/response';

export const GET: APIRoute = async ({ params, locals }) => {
  const tradeId = Number(params.tradeId);
  if (!tradeId) return errorResponse('tradeId requerido', 400);

  const db = await getDb();
  const images = await db.select()
    .from(portfolioImages)
    .where(eq(portfolioImages.tradeId, tradeId))
    .orderBy(asc(portfolioImages.sortOrder))
    .all();

  return jsonResponse(images);
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  const currentUser = locals.currentUser;
  if (!currentUser) return errorResponse('No autorizado', 401);
  if (currentUser.role !== 'provider' && currentUser.role !== 'admin') {
    return errorResponse('Solo prestadores', 403);
  }

  const tradeId = Number(params.tradeId);
  const db = await getDb();

  const trade = await db.select().from(trades).where(and(eq(trades.id, tradeId), eq(trades.userId, currentUser.id))).get();
  if (!trade && currentUser.role !== 'admin') return errorResponse('Oficio no encontrado', 404);

  const formData = await request.formData();
  const file = formData.get('image') as File | null;
  const caption = String(formData.get('caption') || '').trim() || null;

  if (!file || file.size === 0) return errorResponse('Selecciona una imagen', 400);
  if (file.size > 5 * 1024 * 1024) return errorResponse('Max 5MB', 400);

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  const count = await db.select({ c: eq(portfolioImages.tradeId, tradeId) }).from(portfolioImages).all();
  const sortOrder = count.length;

  await db.insert(portfolioImages).values({
    tradeId, url: dataUrl, caption, sortOrder,
  }).run();

  return jsonResponse({ ok: true });
};
