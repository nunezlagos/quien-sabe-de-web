import type { APIRoute } from 'astro';
import { jsonResponse } from '../../../../lib/utils/response';

export const prerender = false;

export const POST: APIRoute = async () => {
	return jsonResponse({ ok: true, mensaje: 'Correo de verificación reenviado' });
};