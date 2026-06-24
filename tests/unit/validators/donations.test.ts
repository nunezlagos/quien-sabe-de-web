// tests/unit/validators/donations.test.ts
// Tests para el schema de intención de donación (POST /api/v1/donations).

import { describe, it, expect } from 'vitest';
import { DonacionCuerpo, PASARELAS } from '../../../src/lib/validators/donations';

describe('DonacionCuerpo', () => {
	it('acepta monto mínimo válido', () => {
		const r = DonacionCuerpo.safeParse({
			amount: '1000',
			provider: 'mercadopago',
		});
		expect(r.success).toBe(true);
		if (r.success) {
			expect(r.data.amount).toBe(1000);
			expect(r.data.provider).toBe('mercadopago');
		}
	});

	it('acepta monto máximo válido', () => {
		const r = DonacionCuerpo.safeParse({
			amount: '9999999',
			provider: 'webpay',
		});
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.amount).toBe(9999999);
	});

	it('coerce string a número', () => {
		const r = DonacionCuerpo.safeParse({
			amount: '5000',
			provider: 'mercadopago',
		});
		expect(r.success).toBe(true);
		if (r.success) expect(typeof r.data.amount).toBe('number');
	});

	it('usa mercadopago como pasarela por default', () => {
		const r = DonacionCuerpo.safeParse({ amount: '5000' });
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.provider).toBe('mercadopago');
	});

	it('rechaza monto menor a $1.000', () => {
		const r = DonacionCuerpo.safeParse({
			amount: '999',
			provider: 'mercadopago',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza monto mayor a $9.999.999', () => {
		const r = DonacionCuerpo.safeParse({
			amount: '10000000',
			provider: 'mercadopago',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza pasarela fuera del enum', () => {
		const r = DonacionCuerpo.safeParse({
			amount: '5000',
			provider: 'paypal',
		});
		expect(r.success).toBe(false);
	});

	it('acepta recurring como "on" (valor de checkbox HTML)', () => {
		const r = DonacionCuerpo.safeParse({
			amount: '5000',
			provider: 'mercadopago',
			recurring: 'on',
		});
		expect(r.success).toBe(true);
	});

	it('acepta recurring ausente como opcional', () => {
		const r = DonacionCuerpo.safeParse({
			amount: '5000',
			provider: 'mercadopago',
		});
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.recurring).toBeUndefined();
	});

	it('rechaza recurring con valor inválido', () => {
		const r = DonacionCuerpo.safeParse({
			amount: '5000',
			provider: 'mercadopago',
			recurring: 'yes-please',
		});
		expect(r.success).toBe(false);
	});

	it('expone las pasarelas conocidas como tupla readonly', () => {
		expect(PASARELAS).toEqual(['mercadopago', 'webpay']);
	});
});
