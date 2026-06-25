import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { trades } from '../../../../database/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const user = (locals as any).user;
  if (!user) return errorResponse('No autorizado', 401);

  const tradeId = Number(params.id);
  if (!tradeId) return errorResponse('ID inválido', 400);

  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  const db = getDb(locals);
  const trade = await db.select().from(trades).where(eq(trades.id, tradeId)).get();
  if (!trade) return errorResponse('Oficio no encontrado', 404);
  if (trade.userId !== user.id && user.role !== 'admin') return errorResponse('No autorizado', 403);

  const allowed = new Set(['active', 'paused']);
  if (body.status && !allowed.has(body.status)) return errorResponse('Estado inválido', 422);

  await db.update(trades).set({ status: body.status || trade.status }).where(eq(trades.id, tradeId)).run();

  return jsonResponse({ ok: true });
};
