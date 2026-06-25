import type { APIRoute } from 'astro';
import { getAvailability } from '../../../../lib/services/availability';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const GET: APIRoute = async ({ params, locals }) => {
  const userId = Number(params.id);
  if (!userId) return errorResponse('ID inválido', 400);
  const slots = await getAvailability(locals, userId);
  return jsonResponse(slots);
};
