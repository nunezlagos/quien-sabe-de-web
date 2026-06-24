import { defineMiddleware } from 'astro/middleware';
import { leerSesion } from './lib/services/auth/sesion';
import { leerCookieSesion, limpiarCookieSesion } from './lib/utils/cookies';
import { buscarUsuarioPorId } from './lib/services/auth/usuarios';

const RUTAS_PROTEGIDAS = ['/dashboard', '/dashboard-admin', '/dashboard-prestador', '/dashboard-user', '/cuenta'];
const RUTAS_AUTH = ['/registro', '/iniciar-sesion'];

function esRutaProtegida(pathname: string): boolean {
	return RUTAS_PROTEGIDAS.some((prefijo) => pathname === prefijo || pathname.startsWith(`${prefijo}/`));
}

function esRutaAuth(pathname: string): boolean {
	return RUTAS_AUTH.some((prefijo) => pathname === prefijo || pathname.startsWith(`${prefijo}/`));
}

export const onRequest = defineMiddleware(async (contexto, siguiente) => {
	const env = contexto.locals.runtime.env;
	contexto.locals.user = undefined;

	const token = leerCookieSesion(contexto.cookies);
	if (token) {
		try {
			const carga = await leerSesion(env, token);
			if (carga) {
				const usuarioDb = await buscarUsuarioPorId(contexto, carga.userId);
				if (usuarioDb && usuarioDb.status === 'active') {
					contexto.locals.user = {
						id: usuarioDb.id,
						email: usuarioDb.email,
						name: usuarioDb.name,
						role: usuarioDb.role,
						status: usuarioDb.status,
					};
				} else {
					limpiarCookieSesion(contexto.cookies, env.PUBLIC_SITE_URL);
				}
			} else {
				limpiarCookieSesion(contexto.cookies, env.PUBLIC_SITE_URL);
			}
		} catch (err) {
			console.error('middleware sesion falló', err);
		}
	}

	const pathname = contexto.url.pathname;
	if (!contexto.locals.user && esRutaProtegida(pathname)) {
		return contexto.redirect(`/iniciar-sesion?redirigir=${encodeURIComponent(pathname)}`);
	}
	if (contexto.locals.user && esRutaAuth(pathname)) {
		return contexto.redirect('/dashboard');
	}

	return siguiente();
});