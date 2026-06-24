import type { APIRoute } from 'astro';
import { RecuperarContrasenaCuerpo } from '../../../../lib/validators/autenticacion';
import { respuestaError, respuestaJson } from '../../../../lib/utils/respuesta';

export const prerender = false;

// PLACEHOLDER: en producción, generar token de un solo uso y enviar email.
// Por seguridad, siempre respondemos 200 sin confirmar si el correo existe
// (evita enumeración de cuentas registradas).
export const POST: APIRoute = async (contexto) => {
	let cuerpo: unknown;
	try {
		cuerpo = await contexto.request.json();
	} catch {
		return respuestaError('cuerpo JSON inválido', 400);
	}

	const parsed = RecuperarContrasenaCuerpo.safeParse(cuerpo);
	if (!parsed.success) {
		return respuestaError('datos inválidos', 400, parsed.error.flatten());
	}

	return respuestaJson({ ok: true });
};