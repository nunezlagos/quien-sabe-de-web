// src/lib/validators/donations.ts
// Schema Zod para la intención de donación (POST /api/v1/donations).
// Los nombres de campos coinciden con el form HTML (snake_case).

import * as z from 'zod';

export const GATEWAYS = ['mercadopago', 'webpay'] as const;
export type Gateway = (typeof GATEWAYS)[number];

export const DonationBody = z.object({
	amount: z.coerce.number().int().min(1000, 'Monto mínimo $1.000').max(9_999_999),
	provider: z.enum(GATEWAYS).default('mercadopago'),
	recurring: z
		.union([z.literal('on'), z.literal('true'), z.literal('1'), z.literal('')])
		.optional(),
});
