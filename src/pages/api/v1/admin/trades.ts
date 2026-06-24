import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { trades, communes, users } from '../../../../database/schema';
import { desc, eq } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const prerender = false;

/**
 * GET /api/v1/admin/trades
 * Lista todos los oficios (trades) con datos del prestador y comuna.
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
				id: trades.id,
				name: trades.name,
				symbol: trades.symbol,
				category: trades.category,
				status: trades.status,
				verified: trades.verified,
				userId: trades.userId,
				userName: users.name,
				userEmail: users.email,
				communeId: trades.communeId,
				communeName: communes.name,
				createdAt: trades.createdAt,
			})
			.from(trades)
			.leftJoin(communes, eq(trades.communeId, communes.id))
			.leftJoin(users, eq(trades.userId, users.id))
			.orderBy(desc(trades.createdAt))
			.all();

		return jsonResponse({ oficios: filas, total: filas.length });
	} catch (err: any) {
		console.error('admin/trades list failed', err);
		return errorResponse(err?.message || 'internal_error', 500);
	}
};
