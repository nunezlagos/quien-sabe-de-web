import type { APIRoute } from 'astro';
import { destruirSesion, leerSesion } from '../../../../lib/services/auth/sesion';
import { limpiarCookieSesion, leerCookieSesion } from '../../../../lib/utils/cookies';
import { jsonResponse } from '../../../../lib/utils/response';

export const prerender = false;

export const POST: APIRoute = async (contexto) => {
	const token = leerCookieSesion(contexto.cookies);
	if (token) {
		const carga = await leerSesion(contexto.locals.runtime.env, token);
		if (carga) {
			await destruirSesion(contexto.locals.runtime.env, token);
		}
	}
	limpiarCookieSesion(contexto.cookies, contexto.locals.runtime.env.PUBLIC_SITE_URL);
	return jsonResponse({ ok: true });
};