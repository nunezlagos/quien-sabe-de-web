import type { APIRoute } from 'astro';
import { LoginBody } from '../../../../lib/validators/auth';
import { verificarContrasena } from '../../../../lib/services/auth/contrasena';
import { buscarUsuarioPorCorreo, usuarioPublico } from '../../../../lib/services/auth/usuarios';
import { crearSesion } from '../../../../lib/services/auth/sesion';
import { establecerCookieSesion } from '../../../../lib/utils/cookies';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const prerender = false;

export const POST: APIRoute = async (contexto) => {
	let cuerpo: unknown;
	try {
		cuerpo = await contexto.request.json();
	} catch {
		return errorResponse('cuerpo JSON inválido', 400);
	}

	const parsed = LoginBody.safeParse(cuerpo);
	if (!parsed.success) {
		return errorResponse('datos inválidos', 400, parsed.error.flatten());
	}

	const currentUser = await buscarUsuarioPorCorreo(contexto, parsed.data.correo);

	let contrasenaValida = false;
	if (currentUser) {
		try {
			contrasenaValida = await verificarContrasena(currentUser.passwordHash, parsed.data.contrasena);
		} catch (err) {
			console.error('verificarContrasena falló', err);
		}
	}

	if (!currentUser || !contrasenaValida) {
		return errorResponse('credenciales inválidas', 401);
	}

	if (currentUser.status === 'banned') {
		return errorResponse('cuenta deshabilitada', 403);
	}

	const sesion = await crearSesion(currentUser);
	establecerCookieSesion(
		contexto.cookies,
		sesion.token,
		sesion.ttlSegundos,
		process.env.PUBLIC_SITE_URL,
	);
	return jsonResponse({ currentUser: usuarioPublico(currentUser) });
};