import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { users, trades, reviews, contactEvents } from '../../../../database/schema';
import { eq } from 'drizzle-orm';
import { errorResponse } from '../../../../lib/utils/response';

export const GET: APIRoute = async ({ locals }) => {
  const currentUser = locals.user;
  if (!currentUser) return errorResponse('No autorizado', 401);

  const db = getDb();
  const userData = await db.select().from(users).where(eq(users.id, currentUser.id)).get();
  const userTrades = await db.select().from(trades).where(eq(trades.userId, currentUser.id)).all();
  const tradeIds = userTrades.map((t) => t.id);
  const userReviews = tradeIds.length > 0
    ? await db.select().from(reviews).where(eq(reviews.tradeId, tradeIds[0])).all()
    : [];
  const userContacts = tradeIds.length > 0
    ? await db.select().from(contactEvents).where(eq(contactEvents.tradeId, tradeIds[0])).all()
    : [];

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: userData,
    trades: userTrades,
    reviews: userReviews,
    contacts: userContacts,
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="mis-datos-quiensabe.json"',
    },
  });
};
