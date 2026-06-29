import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../../database/client';
import { verificationDocuments } from '../../../../../../../database/schema';
import { eq } from 'drizzle-orm';
import { getUploadsService } from '../../../../../../../lib/services/uploads.service';
import { errorResponse, jsonResponse } from '../../../../../../../lib/utils/response';

export const prerender = false;

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export const POST: APIRoute = async (contexto) => {
  const currentUser = contexto.locals.user;
  if (!currentUser) return errorResponse('no autenticado', 401);
  if (currentUser.role !== 'provider' && currentUser.role !== 'admin') {
    return errorResponse('requiere rol provider', 403);
  }

  const formData = await contexto.request.formData().catch(() => null);
  if (!formData) return errorResponse('form-data requerido', 400);

  const file = formData.get('file') as File | null;
  const kind = formData.get('kind') as string | null;

  if (!file || !kind) return errorResponse('file y kind son requeridos', 422);
  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) return errorResponse('content-type no permitido', 422);

  const db = getDb();
  const ext = file.name.split('.').pop() || file.type.split('/')[1];
  const objectKey = `verificaciones/${currentUser.id}/${Date.now()}-${kind}.${ext}`;

  const uploads = getUploadsService();
  await uploads.uploadImage(file, `verificaciones/${currentUser.id}`);

  await db.insert(verificationDocuments).values({
    userId: currentUser.id,
    kind: kind as 'cedula' | 'certificado' | 'comprobante' | 'otro',
    objectKey: objectKey,
    contentType: file.type,
    uploadedAt: new Date(),
  }).run();

  return jsonResponse({ ok: true, object_key: objectKey }, { status: 200 });
};
