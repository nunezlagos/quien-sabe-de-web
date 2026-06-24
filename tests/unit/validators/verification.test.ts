// tests/unit/validators/verification.test.ts
// Tests para el schema de solicitud de verificación (POST /api/v1/providers/me/verification).

import { describe, it, expect } from 'vitest';
import { SolicitudVerificacionCuerpo } from '../../../src/lib/validators/verification';

describe('SolicitudVerificacionCuerpo', () => {
	it('acepta RUT con formato 12345678-9', () => {
		const r = SolicitudVerificacionCuerpo.safeParse({
			rut: '12345678-9',
			trade: 'gasfiter',
		});
		expect(r.success).toBe(true);
	});

	it('acepta RUT con dígito verificador K', () => {
		const r = SolicitudVerificacionCuerpo.safeParse({
			rut: '11111111-K',
			trade: 'electricista',
		});
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.rut).toBe('11111111-K');
	});

	it('acepta RUT de 7 dígitos (persona natural)', () => {
		const r = SolicitudVerificacionCuerpo.safeParse({
			rut: '1234567-9',
			trade: 'jardinero',
		});
		expect(r.success).toBe(true);
	});

	it('rechaza RUT sin guión', () => {
		const r = SolicitudVerificacionCuerpo.safeParse({
			rut: '123456789',
			trade: 'gasfiter',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza RUT con puntos', () => {
		const r = SolicitudVerificacionCuerpo.safeParse({
			rut: '12.345.678-9',
			trade: 'gasfiter',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza RUT con dígito verificador no numérico ni K', () => {
		const r = SolicitudVerificacionCuerpo.safeParse({
			rut: '12345678-X',
			trade: 'gasfiter',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza RUT vacío', () => {
		const r = SolicitudVerificacionCuerpo.safeParse({
			rut: '',
			trade: 'gasfiter',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza oficio vacío', () => {
		const r = SolicitudVerificacionCuerpo.safeParse({
			rut: '12345678-9',
			trade: '',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza oficio ausente', () => {
		const r = SolicitudVerificacionCuerpo.safeParse({
			rut: '12345678-9',
		});
		expect(r.success).toBe(false);
	});
});
