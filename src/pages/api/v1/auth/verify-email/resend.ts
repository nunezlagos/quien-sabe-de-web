import type { APIRoute } from 'astro';
import { respuestaJson } from '../../../../../lib/utils/respuesta';

export const prerender = false;

export const POST: APIRoute = async () => {
	return respuestaJson({ ok: true, mensaje: 'Correo de verificación reenviado' });
};