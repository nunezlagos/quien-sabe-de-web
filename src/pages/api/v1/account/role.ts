import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { users, userRoles } from '../../../../database/schema';
import { eq } from 'drizzle-orm';
import { errorResponse } from '../../../../lib/utils/response';

export const POST: APIRoute = async ({ request, locals }) => {
  const currentUser = locals.user;
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

  const db = getDb();
  const typedRole = role as 'user' | 'provider' | 'admin';

  await db.update(users).set({ role: typedRole }).where(eq(users.id, currentUser.id)).run();

  const existingRole = await db.select().from(userRoles).where(eq(userRoles.userId, currentUser.id)).all();
  if (!existingRole.some(r => r.role === typedRole)) {
    await db.insert(userRoles).values({ userId: currentUser.id, role: typedRole, grantedBy: currentUser.id }).run();
  }

  return new Response(null, {
    status: 302,
    headers: { Location: role === 'provider' ? '/dashboard-prestador' : '/dashboard' },
  });
};
