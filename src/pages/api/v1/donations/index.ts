import type { APIRoute } from 'astro';
import { createDonation } from '../../../lib/services/donations';
import { DonationBody } from '../../../lib/validators/donations';
import { errorResponse, jsonResponse } from '../../../lib/utils/response';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user || null;
  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  const parsed = DonationBody.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map(i => i.message).join(', '), 422);

  const { amount, provider, recurring } = parsed.data;
  const donation = await createDonation(locals, {
    provider,
    amountClp: amount,
    recurring,
    payerEmail: user?.email,
    userId: user?.id,
  });

  const initPoint = provider === 'mercadopago'
    ? `https://www.mercadopago.cl/checkout/v1/redirect?preference_id=mock_${donation.id}`
    : `https://webpay3g.transbank.cl/webpago.cgi?token=mock_${donation.id}`;

  return jsonResponse({ id: donation.id, amount, provider, initPoint }, 201);
};
