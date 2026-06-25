import { z } from 'astro/zod';
import { validateRut } from '../utils/rut';

export const rutSchema = z.string().refine(
  (val) => {
    const result = validateRut(val);
    return result.valid;
  },
  { message: 'RUT inválido o formato incorrecto' }
);
