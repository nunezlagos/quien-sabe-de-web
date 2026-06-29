import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../../database/client';
import { verificationDocuments } from '../../../../../../../database/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../../../../lib/utils/response';

export const prerender = false;

export const POST: APIRoute = async (contexto) => {
  const currentUser = contexto.locals.user;
  if (!currentUser) return errorResponse('no autenticado', 401);

  const id = Number(contexto.params.id);
  if (!id) return errorResponse('id inválido', 400);

  const db = getDb();
  const doc = await db
    .select()
    .from(verificationDocuments)
    .where(eq(verificationDocuments.id, id))
    .get();

  if (!doc) return errorResponse('documento no encontrado', 404);
  if (doc.userId !== currentUser.id && currentUser.role !== 'admin') {
    return errorResponse('no autorizado', 403);
  }

  await db
    .update(verificationDocuments)
    .set({ uploadedAt: new Date() })
    .where(eq(verificationDocuments.id, id))
    .run();

  return jsonResponse({ ok: true }, { status: 200 });
};
