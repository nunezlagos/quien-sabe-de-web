import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { users } from '../../../../database/schema';
import { desc } from 'drizzle-orm';
import { respuestaError, respuestaJson } from '../../../../lib/utils/respuesta';

export const prerender = false;

/**
 * GET /api/v1/admin/users
 * Lista todos los usuarios (sin PII sensible: solo campos operativos).
 * Requiere rol admin. Cualquier otro caso → 403.
 */
export const GET: APIRoute = async (contexto) => {
	const usuario = contexto.locals.user;
	if (!usuario) {
		return respuestaError('no autenticado', 401);
	}
	if (usuario.role !== 'admin') {
		return respuestaError('requiere rol admin', 403);
	}

	try {
		const db = getDb(contexto.locals);
		const filas = await db
			.select({
				id: users.id,
				email: users.email,
				name: users.name,
				role: users.role,
				status: users.status,
				createdAt: users.createdAt,
			})
			.from(users)
			.orderBy(desc(users.createdAt))
			.all();

		return respuestaJson({ usuarios: filas, total: filas.length });
	} catch (err: any) {
		console.error('admin/users list failed', err);
		return respuestaError(err?.message || 'internal_error', 500);
	}
};
