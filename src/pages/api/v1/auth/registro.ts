import type { APIRoute } from 'astro';
import { RegistroCuerpo } from '../../../../lib/validators/autenticacion';
import { hashContrasena } from '../../../../lib/services/auth/contrasena';
import { CorreoYaRegistradoError, crearUsuario, usuarioPublico } from '../../../../lib/services/auth/usuarios';
import { crearSesion } from '../../../../lib/services/auth/sesion';
import { establecerCookieSesion } from '../../../../lib/utils/cookies';
import { respuestaError, respuestaJson } from '../../../../lib/utils/respuesta';

export const prerender = false;

export const POST: APIRoute = async (contexto) => {
	let cuerpo: unknown;
	try {
		cuerpo = await contexto.request.json();
	} catch {
		return respuestaError('cuerpo JSON inválido', 400);
	}

	const parsed = RegistroCuerpo.safeParse(cuerpo);
	if (!parsed.success) {
		return respuestaError('datos inválidos', 400, parsed.error.flatten());
	}

	let contrasenaHasheada: string;
	try {
		contrasenaHasheada = await hashContrasena(parsed.data.contrasena);
	} catch (err) {
		console.error('hashContrasena falló', err);
		return respuestaError('no se pudo procesar la contraseña', 500);
	}

	try {
		const usuario = await crearUsuario(contexto, {
			nombre: parsed.data.nombre,
			correo: parsed.data.correo,
			contrasenaHash: contrasenaHasheada,
		});
		const sesion = await crearSesion(contexto.locals.runtime.env, usuario);
		establecerCookieSesion(
			contexto.cookies,
			sesion.token,
			sesion.ttlSegundos,
			contexto.locals.runtime.env.PUBLIC_SITE_URL,
		);
		return respuestaJson({ usuario: usuarioPublico(usuario) }, { status: 201 });
	} catch (err) {
		if (err instanceof CorreoYaRegistradoError) {
			return respuestaError('correo ya registrado', 409);
		}
		console.error('registro falló', err);
		return respuestaError('no se pudo crear la cuenta', 500);
	}
};