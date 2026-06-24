// src/lib/validators/verification.ts
// Schema Zod para la solicitud de verificación de oficio (POST /api/v1/providers/me/verification).
// Los nombres de campos coinciden con el form HTML (snake_case).

import * as z from 'zod';

export const SolicitudVerificacionCuerpo = z.object({
	rut: z
		.string()
		.trim()
		.regex(/^[0-9]{7,8}-[0-9kK]$/, 'RUT inválido (formato 12345678-9)'),
	trade: z.string().trim().min(1, 'Selecciona un oficio'),
});
