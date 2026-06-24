import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { users } from '../../../lib/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../lib/utils/response';

export const POST: APIRoute = async ({ request, locals }) => {
  const currentUser = locals.currentUser;
  if (!currentUser) return errorResponse('No autorizado', 401);

  const contentType = request.headers.get('content-type') || '';
  let role: string;
  if (contentType.includes('application/json')) {
    const body = await request.json();
    role = body.role;
  } else {
    const form = await request.formData();
    role = form.get('role')?.toString() || '';
  }

  if (!['user', 'provider'].includes(role)) return errorResponse('Rol inválido', 400);

  const db = await getDb();
  await db.update(users).set({ role }).where(eq(users.id, currentUser.id)).run();

  return new Response(null, {
    status: 302,
    headers: { Location: role === 'provider' ? '/dashboard-prestador' : '/dashboard' },
  });
};
