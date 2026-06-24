import { base64ABytes, bytesABase64 } from '../../utils/crypto';
import { timingSafeEqual } from '../../utils/timing';

export const ITERACIONES_PBKDF2 = 200_000;
const LONGITUD_SALT_BYTES = 16;
const LONGITUD_HASH_BYTES = 32;

const PREFIJO = 'pbkdf2';

async function derivarBits(
	contrasena: string,
	salt: Uint8Array,
	iteraciones: number,
	longitudBytes: number,
): Promise<Uint8Array> {
	const material = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(contrasena),
		{ name: 'PBKDF2' },
		false,
		['deriveBits'],
	);
	const bits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: salt as unknown as BufferSource,
			iterations: iteraciones,
			hash: 'SHA-256',
		},
		material,
		longitudBytes * 8,
	);
	return new Uint8Array(bits);
}

export async function hashContrasena(contrasena: string): Promise<string> {
	const salt = new Uint8Array(LONGITUD_SALT_BYTES);
	crypto.getRandomValues(salt);
	const hash = await derivarBits(contrasena, salt, ITERACIONES_PBKDF2, LONGITUD_HASH_BYTES);
	return `${PREFIJO}$${ITERACIONES_PBKDF2}$${bytesABase64(salt)}$${bytesABase64(hash)}`;
}

export async function verificarContrasena(
	hashAlmacenado: string,
	contrasena: string,
): Promise<boolean> {
	if (!hashAlmacenado || typeof hashAlmacenado !== 'string') return false;
	const partes = hashAlmacenado.split('$');
	if (partes.length !== 4) return false;
	const [prefijo, iterStr, saltB64, hashB64] = partes as [string, string, string, string];
	if (prefijo !== PREFIJO) return false;
	const iteraciones = Number.parseInt(iterStr, 10);
	if (!Number.isFinite(iteraciones) || iteraciones <= 0) return false;
	let salt: Uint8Array;
	let hashEsperado: Uint8Array;
	try {
		salt = base64ABytes(saltB64);
		hashEsperado = base64ABytes(hashB64);
	} catch {
		return false;
	}
	if (salt.byteLength === 0 || hashEsperado.byteLength === 0) return false;
	const hashCalculado = await derivarBits(contrasena, salt, iteraciones, hashEsperado.byteLength);
	return timingSafeEqual(hashCalculado, hashEsperado);
}