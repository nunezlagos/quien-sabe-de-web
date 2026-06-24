import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getDb } from '../../../../../database/client';
import { users } from '../../../../../database/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const prerender = false;

const ConsentCuerpo = z
	.object({
		consent_email_product: z.boolean().optional(),
		consent_analytics: z.boolean().optional(),
		consent_profile_public: z.boolean().optional(),
	})
	.refine(
		(obj) =>
			obj.consent_email_product !== undefined ||
			obj.consent_analytics !== undefined ||
			obj.consent_profile_public !== undefined,
		{ message: 'debes enviar al menos un consentimiento' },
	);

/**
 * HU-22.5 — PATCH /api/v1/users/me/consent
 * Actualiza los flags granulares del titular. MVP: sólo escribe en `users`,
 * sin tabla append-only `user_consents` (queda como tarea pendiente del HU).
 */
export const PATCH: APIRoute = async (contexto) => {
	const currentUser = contexto.locals.user;
	if (!currentUser) {
		return errorResponse('no autenticado', 401);
	}

	let cuerpo: unknown;
	try {
		cuerpo = await contexto.request.json();
	} catch {
		return errorResponse('cuerpo JSON inválido', 400);
	}

	const parsed = ConsentCuerpo.safeParse(cuerpo);
	if (!parsed.success) {
		return errorResponse('datos inválidos', 400, parsed.error.flatten());
	}

	const actualizacion: {
		consentEmailProduct?: boolean;
		consentAnalytics?: boolean;
		consentProfilePublic?: boolean;
	} = {};
	if (parsed.data.consent_email_product !== undefined) {
		actualizacion.consentEmailProduct = parsed.data.consent_email_product;
	}
	if (parsed.data.consent_analytics !== undefined) {
		actualizacion.consentAnalytics = parsed.data.consent_analytics;
	}
	if (parsed.data.consent_profile_public !== undefined) {
		actualizacion.consentProfilePublic = parsed.data.consent_profile_public;
	}

	const db = getDb(contexto);
	await db.update(users).set(actualizacion).where(eq(users.id, currentUser.id));

	const actualizado = await db
		.select({
			consentEmailProduct: users.consentEmailProduct,
			consentAnalytics: users.consentAnalytics,
			consentProfilePublic: users.consentProfilePublic,
		})
		.from(users)
		.where(eq(users.id, currentUser.id))
		.get();

	return jsonResponse({ ok: true, consent: actualizado ?? null });
};
