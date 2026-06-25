import type { APIRoute } from 'astro';
import { getDb } from '../../../../../database/client';
import { users } from '../../../../../database/schema';
import { errorResponse, jsonResponse } from '../../../../../lib/utils/response';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ url, locals }) => {
  const db = getDb(locals);
  const token = url.searchParams.get('token');
  if (!token) return errorResponse('Token requerido', 400);

  const user = await db.select()
    .from(users)
    .where(eq(users.emailVerificationToken, token))
    .get();

  if (!user) return errorResponse('Token inválido o expirado', 400);

  await db.update(users)
    .set({ emailVerified: true, emailVerificationToken: null })
    .where(eq(users.id, user.id))
    .run();

  return new Response(null, {
    status: 302,
    headers: { Location: '/iniciar-sesion?email=verificado' },
  });
};
