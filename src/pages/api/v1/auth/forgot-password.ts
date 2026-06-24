import type { APIRoute } from 'astro';
import { ForgotPasswordBody } from '../../../../lib/validators/auth';
import { getDb } from '../../../../lib/db';
import { users } from '../../../../lib/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';
import crypto from 'crypto';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return errorResponse('cuerpo JSON inválido', 400);
  }

  const parsed = ForgotPasswordBody.safeParse(body);
  if (!parsed.success) {
    return errorResponse('datos inválidos', 400, parsed.error.flatten());
  }

  const db = await getDb();
  const user = await db.select()
    .from(users)
    .where(eq(users.email, parsed.data.correo.toLowerCase()))
    .get();

  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    await db.update(users)
      .set({ emailVerificationToken: resetToken })
      .where(eq(users.id, user.id))
      .run();
  }

  return jsonResponse({ ok: true });
};
