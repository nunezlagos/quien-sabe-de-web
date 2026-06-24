import type { AstroCookies } from 'astro';
import { bytesABase64 } from './crypto';

const NOMBRE_COOKIE = 'sesion';
const TTL_POR_DEFECTO_SEGUNDOS = 60 * 60 * 24 * 30;

function debeForzarSeguro(urlPublica?: string): boolean {
	if (!urlPublica) return true;
	return urlPublica.startsWith('https://');
}

export function ttlSesionSegundos(env: { SESSION_TTL_SECONDS?: string }): number {
	const crudo = env.SESSION_TTL_SECONDS;
	if (!crudo) return TTL_POR_DEFECTO_SEGUNDOS;
	const n = Number.parseInt(crudo, 10);
	if (Number.isFinite(n) && n > 0) return n;
	return TTL_POR_DEFECTO_SEGUNDOS;
}

function flagsCookie(segura: boolean): string {
	const partes = ['HttpOnly', 'SameSite=Lax', 'Path=/'];
	if (segura) partes.push('Secure');
	return partes.join('; ');
}

export function establecerCookieSesion(
	cookies: AstroCookies,
	token: string,
	ttlSegundos: number,
	urlPublica?: string,
): void {
	const segura = debeForzarSeguro(urlPublica);
	cookies.set(NOMBRE_COOKIE, token, {
		httpOnly: true,
		secure: segura,
		sameSite: 'lax',
		path: '/',
		maxAge: ttlSegundos,
	});
}

export function limpiarCookieSesion(cookies: AstroCookies, urlPublica?: string): void {
	const segura = debeForzarSeguro(urlPublica);
	cookies.set(NOMBRE_COOKIE, '', {
		httpOnly: true,
		secure: segura,
		sameSite: 'lax',
		path: '/',
		maxAge: 0,
	});
}

export function leerCookieSesion(cookies: AstroCookies): string | undefined {
	return cookies.get(NOMBRE_COOKIE)?.value || undefined;
}

export function serializarCsrf(): string {
	const buf = new Uint8Array(16);
	crypto.getRandomValues(buf);
	return bytesABase64(buf);
}