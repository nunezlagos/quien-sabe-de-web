import type { APIRoute } from 'astro';
import { getAvailability, replaceAvailability } from '../../../../../lib/services/availability';
import { availabilityArraySchema } from '../../../../../lib/validators/availability';
import { errorResponse, jsonResponse } from '../../../../../lib/utils/response';

export const GET: APIRoute = async ({ locals }) => {
  const user = (locals as any).user;
  if (!user) return errorResponse('No autorizado', 401);
  const slots = await getAvailability(locals, user.id);
  return jsonResponse(slots);
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  if (!user) return errorResponse('No autorizado', 401);

  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  const parsed = availabilityArraySchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map(i => i.message).join(', '), 422);

  const slots = await replaceAvailability(locals, user.id, parsed.data);
  return jsonResponse(slots);
};
