import type { APIRoute } from 'astro';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
	const currentUser = ctx.locals.user;
	if (!currentUser) {
		return errorResponse('no autenticado', 401);
	}
	return jsonResponse({
		currentUser: {
			id: currentUser.id,
			nombre: currentUser.name,
			correo: currentUser.email,
			rol: currentUser.role,
		},
	});
};