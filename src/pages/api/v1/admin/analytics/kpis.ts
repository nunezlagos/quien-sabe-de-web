import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { users, trades, contactEvents, reviews, appSettings } from '../../../../database/schema';
import { eq, count, gte, and } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const GET: APIRoute = async ({ locals }) => {
  const u = (locals as any).user;
  if (!u || u.role !== 'admin') return errorResponse('No autorizado', 401);

  const db = getDb(locals);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const totalUsers = (await db.select({ c: count() }).from(users).get())?.c ?? 0;
  const signups30d = (await db.select({ c: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo)).get())?.c ?? 0;
  const activeTrades = (await db.select({ c: count() }).from(trades).where(eq(trades.status, 'active')).get())?.c ?? 0;
  const contacts30d = (await db.select({ c: count() }).from(contactEvents).where(gte(contactEvents.createdAt, thirtyDaysAgo)).get())?.c ?? 0;
  const totalReviews = (await db.select({ c: count() }).from(reviews).get())?.c ?? 0;
  const avgRating = (await db.select({ avg: reviews.rating }).from(reviews).get())?.avg ?? 0;

  return jsonResponse({
    totalUsers, signups30d, activeTrades, contacts30d, totalReviews,
    avgRating: Number(avgRating).toFixed(1),
    periodDays: 30,
  });
};
