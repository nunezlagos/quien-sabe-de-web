import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../database/client';
import { trades } from '../../../../../../database/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../../../lib/utils/response';

export const PATCH: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  if (!user) return errorResponse('No autorizado', 401);

  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  const db = getDb(locals);
  const enabled = body.enabled !== false;
  await db.update(trades).set({ availableNow: enabled }).where(eq(trades.userId, user.id)).run();

  return jsonResponse({ ok: true });
};
