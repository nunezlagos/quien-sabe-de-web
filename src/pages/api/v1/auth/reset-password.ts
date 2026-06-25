import type { APIRoute } from 'astro';
import { ResetPasswordBody } from '../../../../lib/validators/auth';
import { getDb } from '../../../../database/client';
import { users } from '../../../../database/schema';
import { eq } from 'drizzle-orm';
import { hashContrasena } from '../../../../lib/services/auth/contrasena';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  const token = ctx.url.searchParams.get('token');
  if (!token) return errorResponse('token requerido', 400);

  const db = await getDb();
  const user = await db.select()
    .from(users)
    .where(eq(users.emailVerificationToken, token))
    .get();

  if (!user) return errorResponse('token inválido o expirado', 400);

  return jsonResponse({ valid: true });
};

export const POST: APIRoute = async (ctx) => {
  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return errorResponse('cuerpo JSON inválido', 400);
  }

  const parsed = ResetPasswordBody.safeParse(body);
  if (!parsed.success) {
    return errorResponse('datos inválidos', 400, parsed.error.flatten());
  }

  const db = await getDb();
  const user = await db.select()
    .from(users)
    .where(eq(users.emailVerificationToken, parsed.data.token))
    .get();

  if (!user) return errorResponse('token inválido o expirado', 400);

  const passwordHash = await hashContrasena(parsed.data.contrasena);

  await db.update(users)
    .set({
      passwordHash,
      emailVerificationToken: null,
      sessionToken: null,
    })
    .where(eq(users.id, user.id))
    .run();

  return jsonResponse({ ok: true });
};
