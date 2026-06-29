import type { APIRoute } from 'astro';
import { getDb } from '../../../../../database/client';
import { trades } from '../../../../../database/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const tradeId = Number(params.id);
  if (!tradeId) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

  const db = getDb();
  const trade = await db.select().from(trades).where(eq(trades.id, tradeId)).get();
  if (!trade || trade.userId !== user.id) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const availableNow = Boolean(body.availableNow);

  await db.update(trades).set({ availableNow }).where(eq(trades.id, tradeId)).run();

  return new Response(JSON.stringify({ availableNow }), { status: 200 });
};
