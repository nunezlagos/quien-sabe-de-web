import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../database/client';
import { userViews, trades } from '../../../../../../database/schema';
import { eq, and } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../../../lib/utils/response';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return errorResponse('No autorizado', 401);

  const tradeId = Number(params.id);
  if (!Number.isFinite(tradeId)) return errorResponse('ID inválido', 400);

  const db = getDb();

  const trade = await db
    .select({ id: trades.id })
    .from(trades)
    .where(eq(trades.id, tradeId))
    .get();
  if (!trade) return errorResponse('Oficio no encontrado', 404);

  const existing = await db
    .select({ id: userViews.id })
    .from(userViews)
    .where(and(eq(userViews.userId, user.id), eq(userViews.tradeId, tradeId)))
    .get();

  if (existing) {
    await db
      .update(userViews)
      .set({ createdAt: new Date() })
      .where(eq(userViews.id, existing.id))
      .run();
  } else {
    await db
      .insert(userViews)
      .values({ userId: user.id, tradeId })
      .run();
  }

  return jsonResponse({ ok: true });
};
