// tests/unit/validators/trades.test.ts
// Tests para el schema de creación de oficios (POST /api/v1/trades).
// TDD: Red → Green → Refactor → Sabotaje.

import { describe, it, expect } from 'vitest';
import { CreateTradeBody, KNOWN_TRADES } from '../../../src/lib/validators/trades';

describe('CreateTradeBody', () => {
	it('acepta un cuerpo válido con todos los campos', () => {
		const r = CreateTradeBody.safeParse({
			name: 'Gasfiter a domicilio',
			symbol: 'gasfiter',
			description: 'Más de 10 años de experiencia en gasfitería residencial.',
			whatsapp: '98765432',
			base_price_clp: '15000',
		});
		expect(r.success).toBe(true);
		if (r.success) {
			expect(r.data.base_price_clp).toBe(15000);
			expect(r.data.whatsapp).toBe('98765432');
		}
	});

	it('acepta oficio "otro" con symbol_custom', () => {
		const r = CreateTradeBody.safeParse({
			name: 'Servicio de tapicería',
			symbol: 'otro',
			symbol_custom: 'tapicero',
			description: 'Restauración de muebles antiguos y tapizado moderno.',
			whatsapp: '12345678',
			base_price_clp: '20000',
		});
		expect(r.success).toBe(true);
		if (r.success) {
			expect(r.data.symbol).toBe('otro');
			expect(r.data.symbol_custom).toBe('tapicero');
		}
	});

	it('acepta cuerpo sin symbol (se deriva del name)', () => {
		const r = CreateTradeBody.safeParse({
			name: 'Reparación de calefones',
			description: 'Servicio técnico especializado en calefones.',
			whatsapp: '87654321',
			base_price_clp: '25000',
		});
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.symbol).toBeUndefined();
	});

	it('rechaza nombre con menos de 3 caracteres', () => {
		const r = CreateTradeBody.safeParse({
			name: 'ab',
			description: 'Descripción válida con al menos veinte caracteres.',
			whatsapp: '98765432',
			base_price_clp: '15000',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza descripción con menos de 20 caracteres', () => {
		const r = CreateTradeBody.safeParse({
			name: 'Gasfiter',
			description: 'corta',
			whatsapp: '98765432',
			base_price_clp: '15000',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza WhatsApp con formato inválido (no son 8 dígitos)', () => {
		const casos: Array<{ whatsapp: string; motivo: string }> = [
			{ whatsapp: '9876543', motivo: '7 dígitos' },
			{ whatsapp: '987654321', motivo: '9 dígitos' },
			{ whatsapp: '9876abcd', motivo: 'letras' },
			{ whatsapp: '+5698765432', motivo: 'con +' },
			{ whatsapp: '56 9 87654321', motivo: 'con espacios' },
			{ whatsapp: '', motivo: 'vacío' },
		];
		for (const { whatsapp, motivo } of casos) {
			const r = CreateTradeBody.safeParse({
				name: 'Gasfiter',
				description: 'Descripción válida con al menos veinte caracteres.',
				whatsapp,
				base_price_clp: '15000',
			});
			expect(r.success, `debería rechazar WhatsApp "${whatsapp}" (${motivo})`).toBe(false);
		}
	});

	it('rechaza precio base menor a $1.000', () => {
		const r = CreateTradeBody.safeParse({
			name: 'Gasfiter',
			description: 'Descripción válida con al menos veinte caracteres.',
			whatsapp: '98765432',
			base_price_clp: '999',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza precio base mayor a $9.999.999', () => {
		const r = CreateTradeBody.safeParse({
			name: 'Gasfiter',
			description: 'Descripción válida con al menos veinte caracteres.',
			whatsapp: '98765432',
			base_price_clp: '10000000',
		});
		expect(r.success).toBe(false);
	});

	it('rechaza symbol fuera del enum', () => {
		const r = CreateTradeBody.safeParse({
			name: 'Gasfiter',
			symbol: 'astrofisico',
			description: 'Descripción válida con al menos veinte caracteres.',
			whatsapp: '98765432',
			base_price_clp: '15000',
		});
		expect(r.success).toBe(false);
	});

	it('expone los oficios conocidos como tupla readonly', () => {
		expect(KNOWN_TRADES).toContain('gasfiter');
		expect(KNOWN_TRADES).toContain('otro');
		expect(KNOWN_TRADES.length).toBeGreaterThanOrEqual(6);
	});
});
