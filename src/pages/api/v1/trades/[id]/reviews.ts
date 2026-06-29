import type { APIRoute } from 'astro';
import { getDb } from '../../../../../database/client';
import { trades, reviews } from '../../../../../database/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ params, request, locals }) => {
  const tradeId = Number(params.id);
  if (!tradeId) {
    return new Response(JSON.stringify({ error: 'ID de oficio inválido' }), { status: 400 });
  }

  const db = getDb();
  const trade = await db.select().from(trades).where(eq(trades.id, tradeId)).get();
  if (!trade) {
    return new Response(JSON.stringify({ error: 'Oficio no encontrado' }), { status: 404 });
  }

  const formData = await request.formData();
  const reviewerName = (formData.get('reviewerName') as string)?.trim() || 'Anónimo';
  const rating = Number(formData.get('rating'));
  const body = (formData.get('body') as string)?.trim();

  if (!rating || rating < 1 || rating > 5) {
    return new Response(JSON.stringify({ error: 'Rating debe ser 1-5' }), { status: 400 });
  }
  if (!body || body.length < 10) {
    return new Response(JSON.stringify({ error: 'La reseña debe tener al menos 10 caracteres' }), { status: 400 });
  }

  await db.insert(reviews).values({
    tradeId,
    userId: locals.user?.id ?? null,
    reviewerName,
    rating,
    body,
  }).run();

  return new Response(null, {
    status: 302,
    headers: { Location: `/p/${trade.slug}?resena=enviada` },
  });
};
