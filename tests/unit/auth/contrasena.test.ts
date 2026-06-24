import { describe, it, expect } from 'vitest';
import {
	hashContrasena,
	verificarContrasena,
	ITERACIONES_PBKDF2,
} from '../../../src/lib/services/auth/contrasena';

describe('hashContrasena', () => {
	it('produce un hash con formato pbkdf2$<iter>$<saltB64>$<hashB64>', async () => {
		const hash = await hashContrasena('Secreta123!');
		const partes = hash.split('$');
		expect(partes).toHaveLength(4);
		expect(partes[0]).toBe('pbkdf2');
		expect(partes[1]).toBe(String(ITERACIONES_PBKDF2));
		expect(partes[2]).toBeTruthy();
		expect(partes[3]).toBeTruthy();
	});

	it('genera un hash distinto cada vez (salt aleatorio)', async () => {
		const h1 = await hashContrasena('Secreta123!');
		const h2 = await hashContrasena('Secreta123!');
		expect(h1).not.toBe(h2);
	});
});

describe('verificarContrasena', () => {
	it('verifica correctamente la contraseña recién hasheada', async () => {
		const hash = await hashContrasena('Secreta123!');
		expect(await verificarContrasena(hash, 'Secreta123!')).toBe(true);
	});

	it('rechaza contraseña incorrecta', async () => {
		const hash = await hashContrasena('Secreta123!');
		expect(await verificarContrasena(hash, 'otra-cosa')).toBe(false);
	});

	it('rechaza hash malformado', async () => {
		expect(await verificarContrasena('no-es-pbkdf2', 'cualquiera')).toBe(false);
		expect(await verificarContrasena('pbkdf2$abc$def', 'cualquiera')).toBe(false);
		expect(await verificarContrasena('pbkdf2$200000$!!!$hash', 'cualquiera')).toBe(false);
	});

	it('rechaza hash vacío', async () => {
		expect(await verificarContrasena('', 'cualquiera')).toBe(false);
	});

	it('rechaza cuando las iteraciones no son numéricas', async () => {
		expect(await verificarContrasena('pbkdf2$no-num$YWFh$YmJi', 'cualquiera')).toBe(false);
	});

	it('distingue mayúsculas y minúsculas', async () => {
		const hash = await hashContrasena('Secreta123!');
		expect(await verificarContrasena(hash, 'secreta123!')).toBe(false);
		expect(await verificarContrasena(hash, 'SECRETA123!')).toBe(false);
	});
});