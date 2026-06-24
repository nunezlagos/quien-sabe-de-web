import type { APIRoute } from 'astro';
import { errorResponse } from '../../../../lib/utils/response';

export const prerender = false;

const NOMBRE_COOKIE_JOB = 'data_export_requested';
const TTL_SEGUNDOS = 60 * 60 * 24;

/**
 * HU-22.3 — POST /api/v1/users/me/data-export
 * MVP: encola un "job" (cookie flag) y redirige a /cuenta?export=requested.
 * El envío real del ZIP se difiere a un worker / cron (no implementado en MVP).
 */
export const POST: APIRoute = async (contexto) => {
	const currentUser = contexto.locals.user;
	if (!currentUser) {
		return errorResponse('no autenticado', 401);
	}

	contexto.cookies.set(NOMBRE_COOKIE_JOB, '1', {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: TTL_SEGUNDOS,
	});

	return new Response(null, {
		status: 302,
		headers: { Location: '/cuenta?export=requested' },
	});
};
