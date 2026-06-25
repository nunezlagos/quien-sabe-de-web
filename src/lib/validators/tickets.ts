import * as z from 'zod/v4';

export const ticketKindSchema = z.enum(['suplantacion', 'mal_servicio', 'contenido', 'consulta']);
export const ticketStatusSchema = z.enum(['abierto', 'en_revision', 'cerrado']);
export const ticketSenderSchema = z.enum(['author', 'admin', 'system']);

export const ticketCreateSchema = z.object({
  kind: ticketKindSchema,
  targetProviderId: z.number().int().positive().optional(),
  contactEmail: z.string().email().optional(),
  subject: z.string().min(5).max(150),
  body: z.string().min(1).max(5000),
});

export const anonymousTicketCreateSchema = z.object({
  kind: z.literal('consulta'),
  contactEmail: z.string().email(),
  subject: z.string().min(5).max(150),
  body: z.string().min(1).max(5000),
});

export const authenticatedTicketCreateSchema = z.object({
  kind: z.enum(['suplantacion', 'mal_servicio', 'contenido']),
  targetProviderId: z.number().int().positive(),
  subject: z.string().min(5).max(150),
  body: z.string().min(1).max(5000),
});

export const ticketTransitionSchema = z.object({
  status: ticketStatusSchema,
  assigneeAdminId: z.number().int().positive().optional(),
});

export const ticketMessageSchema = z.object({
  body: z.string().min(1).max(5000),
  internalNote: z.boolean().optional().default(false),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
export type AnonymousTicketCreateInput = z.infer<typeof anonymousTicketCreateSchema>;
export type AuthenticatedTicketCreateInput = z.infer<typeof authenticatedTicketCreateSchema>;
export type TicketTransitionInput = z.infer<typeof ticketTransitionSchema>;
export type TicketMessageInput = z.infer<typeof ticketMessageSchema>;
