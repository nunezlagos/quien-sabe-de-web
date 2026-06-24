import type { Usuario } from '../../../database/schema';
import { ttlSesionSegundos } from '../../utils/cookies';
import { kvConCache } from '../../utils/kv-cache';
import { generarToken } from '../../utils/crypto';

const PREFIJO_CLAVE = 'sesion:';

export interface SesionKV {
	token: string;
	ttlSegundos: number;
}

export async function crearSesion(
	env: { SESSION: KVNamespace; SESSION_TTL_SECONDS?: string },
	usuario: Pick<Usuario, 'id' | 'role' | 'status'>,
): Promise<SesionKV> {
	const token = generarToken(32);
	const ttlSegundos = ttlSesionSegundos(env);
	const kv = kvConCache(env.SESSION);
	await kv.put(
		`${PREFIJO_CLAVE}${token}`,
		JSON.stringify({
			userId: usuario.id,
			role: usuario.role,
			status: usuario.status,
			exp: Math.floor(Date.now() / 1000) + ttlSegundos,
		}),
		{ expirationTtl: ttlSegundos },
	);
	return { token, ttlSegundos };
}

export async function destruirSesion(
	env: { SESSION: KVNamespace },
	token: string,
): Promise<void> {
	const kv = kvConCache(env.SESSION);
	await kv.delete(`${PREFIJO_CLAVE}${token}`);
}

export interface CargaSesion {
	userId: number;
	role: 'user' | 'provider' | 'admin';
	status: 'active' | 'banned';
	exp: number;
}

export async function leerSesion(
	env: { SESSION: KVNamespace },
	token: string,
): Promise<CargaSesion | null> {
	const kv = kvConCache(env.SESSION);
	const crudo = await kv.get(`${PREFIJO_CLAVE}${token}`);
	if (!crudo) return null;
	try {
		const parsed = JSON.parse(crudo) as CargaSesion;
		if (
			typeof parsed?.userId !== 'number' ||
			typeof parsed?.exp !== 'number' ||
			parsed.exp < Math.floor(Date.now() / 1000)
		) {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}