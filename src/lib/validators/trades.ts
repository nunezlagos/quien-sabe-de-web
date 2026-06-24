// src/lib/validators/trades.ts
// Schema Zod para la creación de oficios (POST /api/v1/trades).
// Los nombres de campos coinciden con el form HTML (snake_case).

import * as z from 'zod';

export const KNOWN_TRADES = [
	'gasfiter',
	'electricista',
	'jardinero',
	'pintor',
	'costurera',
	'programador',
	'maestro',
	'otro',
] as const;

export type KnownTrade = (typeof KNOWN_TRADES)[number];

export const CreateTradeBody = z.object({
	name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(120),
	symbol: z.enum(KNOWN_TRADES).optional(),
	symbol_custom: z.string().trim().max(30, 'Máximo 30 caracteres').optional(),
	description: z.string().trim().min(20, 'La descripción debe tener al menos 20 caracteres').max(1000),
	whatsapp: z
		.string()
		.trim()
		.regex(/^[0-9]{8}$/, 'WhatsApp debe tener 8 dígitos (formato 9XXXXXXXX sin el 9 inicial)'),
	base_price_clp: z.coerce.number().int().min(1000, 'Precio mínimo $1.000 CLP').max(9_999_999),
});
