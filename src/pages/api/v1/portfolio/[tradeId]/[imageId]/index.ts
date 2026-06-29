import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../database/client';
import { portfolioImages, trades } from '../../../../../../database/schema';
import { eq, and } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../../../lib/utils/response';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const user = (locals as any).user;
  if (!user || (user.role !== 'provider' && user.role !== 'admin')) return errorResponse('No autorizado', 403);

  const tradeId = Number(params.tradeId);
  const imageId = Number((params as any).imageId);
  if (!tradeId || !imageId) return errorResponse('IDs inválidos', 400);

  const db = getDb();
  const img = await db.select().from(portfolioImages).where(
    and(eq(portfolioImages.id, imageId), eq(portfolioImages.tradeId, tradeId))
  ).get();
  if (!img) return errorResponse('Imagen no encontrada', 404);

  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  if (body.caption !== undefined) {
    await db.update(portfolioImages).set({ caption: String(body.caption) })
      .where(eq(portfolioImages.id, imageId)).run();
  }

  return jsonResponse({ ok: true });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = (locals as any).user;
  if (!user || (user.role !== 'provider' && user.role !== 'admin')) return errorResponse('No autorizado', 403);

  const tradeId = Number(params.tradeId);
  const imageId = Number((params as any).imageId);
  if (!tradeId || !imageId) return errorResponse('IDs inválidos', 400);

  const db = getDb();
  const img = await db.select().from(portfolioImages).where(
    and(eq(portfolioImages.id, imageId), eq(portfolioImages.tradeId, tradeId))
  ).get();
  if (!img) return errorResponse('Imagen no encontrada', 404);

  await db.delete(portfolioImages).where(eq(portfolioImages.id, imageId)).run();

  return jsonResponse({ ok: true });
};
