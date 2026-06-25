import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../database/client';
import { users } from '../../../../../../database/schema';
import { errorResponse } from '../../../../../../lib/utils/response';
import { VerificationRequest } from '../../../../../../lib/validators/verification';

export const prerender = false;

export const POST: APIRoute = async (contexto) => {
  const currentUser = contexto.locals.user;
  if (!currentUser) return errorResponse('no autenticado', 401);
  if (currentUser.role !== 'provider' && currentUser.role !== 'admin') {
    return errorResponse('requiere rol provider', 403);
  }

  const formData = await contexto.request.formData();
  const body = Object.fromEntries(formData.entries());
  const parsed = VerificationRequest.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const errorMsg = encodeURIComponent(firstIssue?.message ?? 'datos inválidos');
    return new Response(null, {
      status: 302,
      headers: { Location: `/verificar-oficio?error=${errorMsg}` },
    });
  }

  const { rut, trade } = parsed.data;
  const db = getDb(contexto.locals);
  await db.select().from(users).limit(1).all();

  return new Response(null, {
    status: 302,
    headers: {
      Location: `/verificar-oficio?ok=1&trade=${encodeURIComponent(trade)}&rut=${encodeURIComponent(rut)}`,
    },
  });
};
