import type { APIRoute } from 'astro';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const prerender = false;

export const GET: APIRoute = async (contexto) => {
	const usuario = contexto.locals.user;
	if (!usuario) {
		return errorResponse('no autenticado', 401);
	}
	return jsonResponse({
		usuario: {
			id: usuario.id,
			nombre: usuario.name,
			correo: usuario.email,
			rol: usuario.role,
		},
	});
};