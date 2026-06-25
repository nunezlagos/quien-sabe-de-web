import type { APIRoute } from 'astro';
import { RegisterBody } from '../../../../lib/validators/auth';
import { hashContrasena } from '../../../../lib/services/auth/contrasena';
import { CorreoYaRegistradoError, crearUsuario, usuarioPublico } from '../../../../lib/services/auth/usuarios';
import { crearSesion } from '../../../../lib/services/auth/sesion';
import { establecerCookieSesion } from '../../../../lib/utils/cookies';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';
import { getDb } from '../../../../database/client';
import { users } from '../../../../database/schema';
import { eq } from 'drizzle-orm';
import { sendMail, buildVerificationEmail } from '../../../../lib/services/email/mailpit';
import crypto from 'crypto';

export const prerender = false;

export const POST: APIRoute = async (contexto) => {
	let cuerpo: unknown;
	try {
		cuerpo = await contexto.request.json();
	} catch {
		return errorResponse('cuerpo JSON inválido', 400);
	}

	const parsed = RegisterBody.safeParse(cuerpo);
	if (!parsed.success) {
		return errorResponse('datos inválidos', 400, parsed.error.flatten());
	}

	let contrasenaHasheada: string;
	try {
		contrasenaHasheada = await hashContrasena(parsed.data.contrasena);
	} catch (err) {
		console.error('hashContrasena falló', err);
		return errorResponse('no se pudo procesar la contraseña', 500);
	}

	try {
		const currentUser = await crearUsuario(contexto, {
			nombre: parsed.data.nombre,
			correo: parsed.data.correo,
			contrasenaHash: contrasenaHasheada,
		});

		const verificationToken = crypto.randomBytes(32).toString('hex');
		const db = await getDb();
		await db.update(users).set({ emailVerificationToken: verificationToken }).where(eq(users.id, currentUser.id)).run();

		const siteUrl = contexto.locals.runtime.env.PUBLIC_SITE_URL || 'http://127.0.0.1:4323';
		sendMail(buildVerificationEmail(currentUser.email, verificationToken, siteUrl));

		const sesion = await crearSesion(contexto.locals.runtime.env, currentUser);
		establecerCookieSesion(
			contexto.cookies,
			sesion.token,
			sesion.ttlSegundos,
			contexto.locals.runtime.env.PUBLIC_SITE_URL,
		);
		return jsonResponse({ currentUser: usuarioPublico(currentUser) }, { status: 201 });
	} catch (err) {
		if (err instanceof CorreoYaRegistradoError) {
			return errorResponse('correo ya registrado', 409);
		}
		console.error('registro falló', err);
		return errorResponse('no se pudo crear la cuenta', 500);
	}
};