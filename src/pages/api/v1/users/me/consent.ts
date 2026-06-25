import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { users } from '../../../../database/schema';
import { eq } from 'drizzle-orm';
import * as z from 'zod/v4';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

const consentSchema = z.object({
  consentEmailProduct: z.boolean().optional(),
  consentAnalytics: z.boolean().optional(),
  consentProfilePublic: z.boolean().optional(),
});

export const GET: APIRoute = async ({ locals }) => {
  const user = (locals as any).user;
  if (!user) return errorResponse('No autorizado', 401);

  const db = getDb(locals);
  const u = await db.select({
    consentEmailProduct: users.consentEmailProduct,
    consentAnalytics: users.consentAnalytics,
    consentProfilePublic: users.consentProfilePublic,
  }).from(users).where(eq(users.id, user.id)).get();

  return jsonResponse(u || {});
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  if (!user) return errorResponse('No autorizado', 401);

  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  const parsed = consentSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map(i => i.message).join(', '), 422);

  const db = getDb(locals);
  await db.update(users).set(parsed.data).where(eq(users.id, user.id)).run();

  return jsonResponse({ ok: true });
};
