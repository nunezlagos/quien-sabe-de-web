import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { users } from '../../../../database/schema';
import { eq } from 'drizzle-orm';
import { errorResponse } from '../../../../lib/utils/response';

export const POST: APIRoute = async ({ locals }) => {
  const currentUser = locals.user;
  if (!currentUser) return errorResponse('No autorizado', 401);

  const db = getDb(locals);
  await db.delete(users).where(eq(users.id, currentUser.id)).run();

  return new Response(null, {
    status: 302,
    headers: { Location: '/?cuenta=eliminada' },
  });
};
