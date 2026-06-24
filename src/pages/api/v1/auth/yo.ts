import type { APIRoute } from 'astro';
import { respuestaError, respuestaJson } from '../../../../lib/utils/respuesta';

export const prerender = false;

export const GET: APIRoute = async (contexto) => {
	const usuario = contexto.locals.user;
	if (!usuario) {
		return respuestaError('no autenticado', 401);
	}
	return respuestaJson({
		usuario: {
			id: usuario.id,
			nombre: usuario.name,
			correo: usuario.email,
			rol: usuario.role,
		},
	});
};