import * as z from 'zod';

export const RegisterBody = z.object({
  nombre: z.string().min(2, 'mínimo 2 caracteres').max(120),
  correo: z.string().email('correo inválido').max(255).toLowerCase(),
  contrasena: z
    .string()
    .min(8, 'mínimo 8 caracteres')
    .max(128, 'máximo 128 caracteres')
    .regex(/[A-Z]/, 'falta una mayúscula')
    .regex(/[0-9]/, 'falta un número'),
});

export const LoginBody = z.object({
  correo: z.string().email('correo inválido').max(255).toLowerCase(),
  contrasena: z.string().min(1).max(128),
});

const PasswordPolicy = z
  .string()
  .min(8, 'mínimo 8 caracteres')
  .max(128, 'máximo 128 caracteres')
  .regex(/[A-Z]/, 'falta una mayúscula')
  .regex(/[0-9]/, 'falta un número');

export const ForgotPasswordBody = z.object({
  correo: z.string().email('correo inválido').max(255).toLowerCase(),
});

export const ResetPasswordBody = z.object({
  token: z.string().min(1, 'token requerido'),
  contrasena: PasswordPolicy,
});

export type RegisterBodyInferred = z.infer<typeof RegisterBody>;
export type LoginBodyInferred = z.infer<typeof LoginBody>;
export type ForgotPasswordBodyInferred = z.infer<typeof ForgotPasswordBody>;
export type ResetPasswordBodyInferred = z.infer<typeof ResetPasswordBody>;
