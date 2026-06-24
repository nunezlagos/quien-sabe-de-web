import { getDb } from '../../../database/client';
import { users } from '../../../database/schema';
import type { Usuario } from '../../../database/schema';
import { eq } from 'drizzle-orm';

export class CorreoYaRegistradoError extends Error {
	constructor() {
		super('correo ya registrado');
		this.name = 'CorreoYaRegistradoError';
	}
}

export async function crearUsuario(
	contexto: { locals: App.Locals },
	input: { nombre: string; correo: string; contrasenaHash: string },
): Promise<Usuario> {
	const db = getDb(contexto);
	try {
		const fila = await db
			.insert(users)
			.values({
				email: input.correo,
				name: input.nombre,
				passwordHash: input.contrasenaHash,
				role: 'user',
				status: 'active',
			})
			.returning()
			.get();
		return fila;
	} catch (err) {
		const mensajes: string[] = [];
		const visitar = (e: unknown) => {
			if (e == null) return;
			if (e instanceof Error) {
				mensajes.push(e.message);
				if ('cause' in e && (e as { cause?: unknown }).cause) {
					visitar((e as { cause?: unknown }).cause);
				}
			} else if (typeof e === 'object' && e !== null && 'message' in e) {
				mensajes.push(String((e as { message: unknown }).message));
			} else {
				mensajes.push(String(e));
			}
		};
		visitar(err);
		const mensajeCompleto = mensajes.join(' | ');
		if (
			mensajes.some((m) => /UNIQUE|unique|SQLITE_CONSTRAINT/i.test(m))
		) {
			throw new CorreoYaRegistradoError();
		}
		console.error('[crearUsuario] fallo no-único:', mensajeCompleto);
		throw err;
	}
}

export async function buscarUsuarioPorCorreo(
	contexto: { locals: App.Locals },
	correo: string,
): Promise<Usuario | null> {
	const db = getDb(contexto);
	const fila = await db
		.select()
		.from(users)
		.where(eq(users.email, correo.toLowerCase()))
		.get();
	return fila ?? null;
}

export async function buscarUsuarioPorId(
	contexto: { locals: App.Locals },
	id: number,
): Promise<Usuario | null> {
	const db = getDb(contexto);
	const fila = await db
		.select()
		.from(users)
		.where(eq(users.id, id))
		.get();
	return fila ?? null;
}

export function usuarioPublico(u: Usuario) {
	return {
		id: u.id,
		nombre: u.name,
		correo: u.email,
		rol: u.role,
	};
}