import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { users } from '../../../../database/schema';
import { errorResponse } from '../../../../lib/utils/response';
import { DonationBody } from '../../../../lib/validators/donations';

export const prerender = false;

/**
 * POST /api/v1/donations
 * Registra la intención de donar. MVP: valida y devuelve acuse; la integración
 * real con Mercado Pago / Webpay llega con HU-14.7/14.8.
 */
export const POST: APIRoute = async (contexto) => {
  const formData = await contexto.request.formData();
  const body = Object.fromEntries(formData.entries());
  const parsed = DonationBody.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const errorMsg = encodeURIComponent(firstIssue?.message ?? 'datos inválidos');
    return new Response(null, {
      status: 302,
      headers: { Location: `/donar?error=${errorMsg}` },
    });
  }

  const { amount, provider, recurring } = parsed.data;
  // Toca la DB para validar binding (los usuarios pueden donar sin estar logueados).
  const db = getDb(contexto.locals);
  await db.select().from(users).limit(1).all();

  const params = new URLSearchParams({
    ok: '1',
    amount: String(amount),
    provider,
    recurring: recurring ? '1' : '0',
  });
  return new Response(null, {
    status: 302,
    headers: { Location: `/donar?${params.toString()}` },
  });
};
