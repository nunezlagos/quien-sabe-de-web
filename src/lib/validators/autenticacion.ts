import { z } from 'zod';

export const RegistroCuerpo = z.object({
	nombre: z.string().min(2, 'mínimo 2 caracteres').max(120),
	correo: z.string().email('correo inválido').max(255).toLowerCase(),
	contrasena: z
		.string()
		.min(8, 'mínimo 8 caracteres')
		.max(128, 'máximo 128 caracteres')
		.regex(/[A-Z]/, 'falta una mayúscula')
		.regex(/[0-9]/, 'falta un número'),
});

export const InicioSesionCuerpo = z.object({
	correo: z.string().email('correo inválido').max(255).toLowerCase(),
	contrasena: z.string().min(1).max(128),
});

const PoliticaContrasena = z
	.string()
	.min(8, 'mínimo 8 caracteres')
	.max(128, 'máximo 128 caracteres')
	.regex(/[A-Z]/, 'falta una mayúscula')
	.regex(/[0-9]/, 'falta un número');

export const RecuperarContrasenaCuerpo = z.object({
	correo: z.string().email('correo inválido').max(255).toLowerCase(),
});

export const RestablecerContrasenaCuerpo = z.object({
	token: z.string().min(1, 'token requerido'),
	contrasena: PoliticaContrasena,
});

export type RegistroCuerpoInferido = z.infer<typeof RegistroCuerpo>;
export type InicioSesionCuerpoInferido = z.infer<typeof InicioSesionCuerpo>;
export type RecuperarContrasenaCuerpoInferido = z.infer<typeof RecuperarContrasenaCuerpo>;
export type RestablecerContrasenaCuerpoInferido = z.infer<typeof RestablecerContrasenaCuerpo>;