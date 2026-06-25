import type { APIRoute } from 'astro';
import { updateDonationStatus } from '../../../lib/services/donations';
import { errorResponse, jsonResponse } from '../../../lib/utils/response';

export const POST: APIRoute = async ({ request, locals }) => {
  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  const { type, data } = body;
  if (!data?.id) return errorResponse('ID no proporcionado', 400);

  const externalId = String(data.id);
  const status = type === 'payment' ? 'approved' : 'pending';

  const donation = await updateDonationStatus(locals, externalId, status, 'mercadopago');
  if (!donation) return jsonResponse({ ok: false, message: 'Donación no encontrada' });

  return jsonResponse({ ok: true });
};
