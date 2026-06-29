import type { APIRoute } from 'astro';
import { getDb } from '../../../../../database/client';
import { users } from '../../../../../database/schema';
import { eq } from 'drizzle-orm';
import { destruirSesion, leerSesion } from '../../../../../lib/services/auth/sesion';
import { limpiarCookieSesion, leerCookieSesion } from '../../../../../lib/utils/cookies';
import { errorResponse } from '../../../../../lib/utils/response';

export const prerender = false;

const CONFIRM_TEXTO = 'ELIMINAR';

/**
 * HU-22.4 — DELETE /api/v1/users/me
 * MVP: hard delete (no soft delete / anonimización). El body debe incluir
 * `confirm="ELIMINAR"` exactamente para ejecutar la acción.
 *
 * Pasos:
 *   1. Verifica auth y texto de confirmación.
 *   2. Revoca la sesión KV del usuario.
 *   3. DELETE FROM users WHERE id = ? (cascade borra trades).
 *   4. Limpia la cookie y redirige a /.
 */
export const DELETE: APIRoute = async (contexto) => {
	const usuario = contexto.locals.user;
	if (!usuario) {
		return errorResponse('no autenticado', 401);
	}

	let confirmacion = '';
	const tipoContenido = contexto.request.headers.get('content-type') ?? '';
	try {
		if (tipoContenido.includes('application/json')) {
			const cuerpo = (await contexto.request.json()) as { confirm?: unknown };
			confirmacion = typeof cuerpo.confirm === 'string' ? cuerpo.confirm : '';
		} else {
			const form = await contexto.request.formData();
			confirmacion = String(form.get('confirm') ?? '');
		}
	} catch {
		return errorResponse('cuerpo inválido', 400);
	}

	if (confirmacion.trim() !== CONFIRM_TEXTO) {
		return errorResponse(`confirmación requerida: escribe "${CONFIRM_TEXTO}"`, 400);
	}

	const token = leerCookieSesion(contexto.cookies);
	if (token) {
		const carga = await leerSesion(token);
		if (carga) {
			await destruirSesion(token);
		}
	}

	const db = getDb();
	await db.delete(users).where(eq(users.id, usuario.id));

	limpiarCookieSesion(contexto.cookies, process.env.PUBLIC_SITE_URL);
	contexto.cookies.delete('data_export_requested', { path: '/' });

	return new Response(null, {
		status: 302,
		headers: { Location: '/' },
	});
};
