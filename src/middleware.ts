import { defineMiddleware } from 'astro/middleware';
import { leerSesion } from './lib/services/auth/sesion';
import { leerCookieSesion, limpiarCookieSesion } from './lib/utils/cookies';
import { buscarUsuarioPorId } from './lib/services/auth/usuarios';
import { getDb } from './database/client';
import { userRoles } from './database/schema';
import { eq } from 'drizzle-orm';
import { createContainer } from './lib/di/container';

const RUTAS_PROTEGIDAS = ['/dashboard', '/dashboard-admin', '/dashboard-prestador', '/dashboard-user', '/cuenta'];
const RUTAS_AUTH = ['/registro', '/iniciar-sesion'];

function esRutaProtegida(pathname: string): boolean {
	return RUTAS_PROTEGIDAS.some((prefijo) => pathname === prefijo || pathname.startsWith(`${prefijo}/`));
}

function esRutaAuth(pathname: string): boolean {
	return RUTAS_AUTH.some((prefijo) => pathname === prefijo || pathname.startsWith(`${prefijo}/`));
}

export const onRequest = defineMiddleware(async (contexto, siguiente) => {
	const env = contexto.locals.runtime?.env;
	contexto.locals.user = undefined;

	try {
		(contexto.locals as { container?: unknown }).container = createContainer(contexto);
	} catch (err) {
		console.error('[container] failed to create container:', err);
	}

	const token = leerCookieSesion(contexto.cookies);
	if (token && env?.SESSION) {
		try {
			const carga = await leerSesion({ SESSION: env.SESSION }, token);
			if (carga) {
				const usuarioDb = await buscarUsuarioPorId(contexto, carga.userId);
				if (usuarioDb && usuarioDb.status === 'active') {
					const db = getDb(contexto);
					const roles = (await db
						.select({ role: userRoles.role })
						.from(userRoles)
						.where(eq(userRoles.userId, usuarioDb.id))
						.all()
					).map(r => r.role);
					const activeRole = contexto.cookies.get('active_role')?.value || usuarioDb.role;
					contexto.locals.user = {
						id: usuarioDb.id,
						email: usuarioDb.email,
						name: usuarioDb.name,
						role: usuarioDb.role,
						roles: [usuarioDb.role, ...roles],
						activeRole,
						status: usuarioDb.status,
						onboardedAt: usuarioDb.onboardedAt,
					};
				} else {
					limpiarCookieSesion(contexto.cookies, env.PUBLIC_SITE_URL || '');
				}
			} else {
				limpiarCookieSesion(contexto.cookies, env.PUBLIC_SITE_URL || '');
			}
		} catch (err) {
			console.error('middleware sesion falló', err);
		}
	}

	const pathname = contexto.url.pathname;
	const usuario = contexto.locals.user;

	if (!usuario && esRutaProtegida(pathname)) {
		return contexto.redirect(`/iniciar-sesion?redirigir=${encodeURIComponent(pathname)}`);
	}
	if (usuario && esRutaAuth(pathname)) {
		return contexto.redirect('/dashboard');
	}

	if (usuario && usuario.role === 'user' && !usuario.onboardedAt) {
		const esRutaOnboarding = pathname === '/onboarding';
		const esRutaApi = pathname.startsWith('/api/');
		if (!esRutaOnboarding && !esRutaApi) {
			return contexto.redirect('/onboarding');
		}
	}

	if (usuario && pathname === '/dashboard') {
		const targetRole = usuario.activeRole || usuario.role;
		if (targetRole === 'provider') {
			return contexto.redirect('/dashboard-prestador');
		}
		if (targetRole === 'admin') {
			return contexto.redirect('/dashboard-admin');
		}
	}

	if (usuario && pathname === '/dashboard-prestador' && !(usuario.roles ?? []).includes('provider')) {
		return contexto.redirect('/dashboard');
	}
	if (usuario && pathname === '/dashboard-admin' && !(usuario.roles ?? []).includes('admin')) {
		return contexto.redirect('/dashboard');
	}

	return siguiente();
});