import type { APIRoute } from 'astro';
import { getDb } from '../../../../../lib/db';
import { users } from '../../../../../lib/schema';
import { errorResponse, jsonResponse } from '../../../../../lib/utils/response';
import { eq } from 'drizzle-orm';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const db = await getDb();
  const currentUser = locals.currentUser;
  if (!currentUser || currentUser.role !== 'admin') return errorResponse('No autorizado', 401);

  const body = await request.json();
  const userId = Number(body.userId);
  const action = body.action; // 'ban' | 'unban'

  if (!userId || !['ban', 'unban'].includes(action)) return errorResponse('Parámetros inválidos', 400);

  const status = action === 'ban' ? 'banned' : 'active';
  await db.update(users).set({ status }).where(eq(users.id, userId)).run();

  return jsonResponse({ ok: true, status });
};
