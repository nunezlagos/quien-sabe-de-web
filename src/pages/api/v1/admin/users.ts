import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { users } from '../../../../database/schema';
import { desc, eq } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const prerender = false;

/**
 * GET /api/v1/admin/users
 * Lista todos los usuarios (sin PII sensible: solo campos operativos).
 * Requiere rol admin. Cualquier otro caso → 403.
 */
export const GET: APIRoute = async (contexto) => {
	const currentUser = contexto.locals.user;
	if (!currentUser) {
		return errorResponse('no autenticado', 401);
	}
	if (currentUser.role !== 'admin') {
		return errorResponse('requiere rol admin', 403);
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

		return jsonResponse({ usuarios: filas, total: filas.length });
	} catch (err: any) {
		console.error('admin/users list failed', err);
		return errorResponse(err?.message || 'internal_error', 500);
	}
};

/**
 * PATCH /api/v1/admin/users
 * Ban/Unban un usuario. Requiere rol admin.
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
	const currentUser = locals.user;
	if (!currentUser) return errorResponse('no autenticado', 401);
	if (currentUser.role !== 'admin') return errorResponse('requiere rol admin', 403);

	let body: any;
	try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

	const userId = Number(body.userId);
	const action = body.action;
	if (!userId || !['ban', 'unban'].includes(action)) return errorResponse('Parámetros inválidos', 400);

	const db = getDb(locals);
	const status = action === 'ban' ? 'banned' : 'active';
	await db.update(users).set({ status }).where(eq(users.id, userId)).run();

	return jsonResponse({ ok: true, status });
};
