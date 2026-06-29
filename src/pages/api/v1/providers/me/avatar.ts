import type { APIRoute } from 'astro';
import { getDb } from '../../../../../database/client';
import { users } from '../../../../../database/schema';
import { errorResponse } from '../../../../../lib/utils/response';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb();
  const currentUser = locals.user;
  if (!currentUser) return errorResponse('No autorizado', 401);

  const formData = await request.formData();
  const file = formData.get('avatar') as File | null;

  if (!file || file.size === 0) return errorResponse('Selecciona una imagen', 400);
  if (file.size > 2 * 1024 * 1024) return errorResponse('La imagen no puede superar 2MB', 400);
  if (!file.type.startsWith('image/')) return errorResponse('Solo imágenes (PNG, JPG)', 400);

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  await db.update(users).set({ avatarUrl: dataUrl }).where(eq(users.id, currentUser.id)).run();

  return new Response(null, {
    status: 302,
    headers: { Location: '/dashboard-prestador?perfil=actualizado' },
  });
};
