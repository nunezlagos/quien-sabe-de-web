import type { APIRoute } from 'astro';
import { RestablecerContrasenaCuerpo } from '../../../../lib/validators/autenticacion';
import { respuestaError, respuestaJson } from '../../../../lib/utils/respuesta';

export const prerender = false;

// PLACEHOLDER: en producción, validar token, hashear contraseña y actualizar.
// Devuelve 400 si el token es inválido/expirado para que el cliente muestre
// la pantalla de "enlace expirado".
export const POST: APIRoute = async (contexto) => {
	let cuerpo: unknown;
	try {
		cuerpo = await contexto.request.json();
	} catch {
		return respuestaError('cuerpo JSON inválido', 400);
	}

	const parsed = RestablecerContrasenaCuerpo.safeParse(cuerpo);
	if (!parsed.success) {
		return respuestaError('datos inválidos', 400, parsed.error.flatten());
	}

	return respuestaJson({ ok: true });
};