import type { APIRoute } from 'astro';
import { ForgotPasswordBody } from '../../../../lib/validators/auth';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const prerender = false;

// PLACEHOLDER: en producción, generar token de un solo uso y enviar email.
// Por seguridad, siempre respondemos 200 sin confirmar si el correo existe
// (evita enumeración de cuentas registradas).
export const POST: APIRoute = async (contexto) => {
	let cuerpo: unknown;
	try {
		cuerpo = await contexto.request.json();
	} catch {
		return errorResponse('cuerpo JSON inválido', 400);
	}

	const parsed = ForgotPasswordBody.safeParse(cuerpo);
	if (!parsed.success) {
		return errorResponse('datos inválidos', 400, parsed.error.flatten());
	}

	return jsonResponse({ ok: true });
};