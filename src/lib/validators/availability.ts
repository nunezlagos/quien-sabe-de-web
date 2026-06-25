import { z } from 'zod/v4';

export const availabilityRangeSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM requerido'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM requerido'),
}).refine((v) => v.endTime > v.startTime, { message: 'end_time debe ser mayor a start_time', path: ['endTime'] });

export const availabilityArraySchema = z.array(availabilityRangeSchema).max(50);

export type AvailabilityRange = z.infer<typeof availabilityRangeSchema>;
