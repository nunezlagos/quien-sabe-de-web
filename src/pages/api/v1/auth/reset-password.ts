import type { APIRoute } from 'astro';
import { ResetPasswordBody } from '../../../../lib/validators/auth';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const prerender = false;

// GET: validates a reset token (placeholder - actual token validation requires KV/db).
export const GET: APIRoute = async (ctx) => {
  const token = ctx.url.searchParams.get('token');
  if (!token) {
    return errorResponse('token requerido', 400);
  }
  // PLACEHOLDER: in production, check token exists in KV/db and isn't expired.
  return jsonResponse({ valid: true });
};

// POST: validates token and updates password (placeholder).
export const POST: APIRoute = async (ctx) => {
	let body: unknown;
	try {
		body = await ctx.request.json();
	} catch {
		return errorResponse('cuerpo JSON inválido', 400);
	}

	const parsed = ResetPasswordBody.safeParse(body);
	if (!parsed.success) {
		return errorResponse('datos inválidos', 400, parsed.error.flatten());
	}

	return jsonResponse({ ok: true });
};