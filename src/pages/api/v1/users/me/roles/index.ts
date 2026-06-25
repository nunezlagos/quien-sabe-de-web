import type { APIRoute } from 'astro';
import { addRoleToUser } from '../../../../../../lib/services/roles';
import { errorResponse } from '../../../../../../lib/utils/response';

export const prerender = false;

const AUTO_ASSIGNABLE = ['provider'];

export const POST: APIRoute = async (contexto) => {
  const currentUser = contexto.locals.user;
  if (!currentUser) return errorResponse('no autenticado', 401);

  const body = await contexto.request.json().catch(() => ({}));
  const { role } = body;

  if (!role || typeof role !== 'string') {
    return errorResponse('role es requerido', 400);
  }

  if (!AUTO_ASSIGNABLE.includes(role)) {
    return errorResponse('rol no auto-asignable', 403);
  }

  await addRoleToUser(contexto.locals, currentUser.id, role as 'provider');

  return new Response(JSON.stringify({ ok: true, role }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
