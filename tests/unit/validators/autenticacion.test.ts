import { describe, it, expect } from 'vitest';
import { RegistroCuerpo, InicioSesionCuerpo } from '../../../src/lib/validators/autenticacion';

describe('RegistroCuerpo', () => {
	it('acepta un cuerpo válido', () => {
		const resultado = RegistroCuerpo.safeParse({
			nombre: 'Ana Pérez',
			correo: 'ANA@EJEMPLO.CL',
			contrasena: 'Secreta123!',
		});
		expect(resultado.success).toBe(true);
		if (resultado.success) {
			expect(resultado.data.correo).toBe('ana@ejemplo.cl');
		}
	});

	it('rechaza contraseña muy corta', () => {
		const r = RegistroCuerpo.safeParse({
			nombre: 'Ana',
			correo: 'ana@ejemplo.cl',
			contrasena: 'abc',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza contraseña sin mayúscula', () => {
		const r = RegistroCuerpo.safeParse({
			nombre: 'Ana',
			correo: 'ana@ejemplo.cl',
			contrasena: 'secreta123!',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza contraseña sin número', () => {
		const r = RegistroCuerpo.safeParse({
			nombre: 'Ana',
			correo: 'ana@ejemplo.cl',
			contrasena: 'Secretas!',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza email inválido', () => {
		const r = RegistroCuerpo.safeParse({
			nombre: 'Ana',
			correo: 'no-es-email',
			contrasena: 'Secreta123!',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza nombre muy corto', () => {
		const r = RegistroCuerpo.safeParse({
			nombre: 'A',
			correo: 'ana@ejemplo.cl',
			contrasena: 'Secreta123!',
		});
		expect(r.success).toBe(false);
	});
});

describe('InicioSesionCuerpo', () => {
	it('acepta cuerpo mínimo', () => {
		const r = InicioSesionCuerpo.safeParse({
			correo: 'ana@ejemplo.cl',
			contrasena: 'cualquiera',
		});
		expect(r.success).toBe(true);
	});

	it('normaliza el correo a minúsculas', () => {
		const r = InicioSesionCuerpo.safeParse({
			correo: 'Ana@Ejemplo.CL',
			contrasena: 'x',
		});
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.correo).toBe('ana@ejemplo.cl');
	});

	it('rechaza email inválido', () => {
		const r = InicioSesionCuerpo.safeParse({
			correo: 'no-email',
			contrasena: 'cualquiera',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza contraseña vacía', () => {
		const r = InicioSesionCuerpo.safeParse({
			correo: 'ana@ejemplo.cl',
			contrasena: '',
		});
		expect(r.success).toBe(false);
	});
});