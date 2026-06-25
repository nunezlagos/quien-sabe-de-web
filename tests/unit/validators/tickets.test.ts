import { describe, it, expect } from 'vitest';
import { anonymousTicketCreateSchema, authenticatedTicketCreateSchema, ticketTransitionSchema, ticketMessageSchema } from '../../../src/lib/validators/tickets';

describe('anonymousTicketCreateSchema', () => {
  it('accepts valid consulta ticket with contact email', () => {
    const result = anonymousTicketCreateSchema.safeParse({
      kind: 'consulta',
      contactEmail: 'juan@ejemplo.cl',
      subject: 'Tengo una consulta sobre el servicio',
      body: 'Me gustaría saber si atienden los sábados.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects kind other than consulta', () => {
    const result = anonymousTicketCreateSchema.safeParse({
      kind: 'suplantacion',
      contactEmail: 'juan@ejemplo.cl',
      subject: 'Sujeto suplantando identidad',
      body: 'Este prestador está usando fotos falsas.',
    });
    expect(result.success).toBe(false);
  });

  it('requires contact email', () => {
    const result = anonymousTicketCreateSchema.safeParse({
      kind: 'consulta',
      subject: 'Consulta sobre horarios',
      body: 'Hola, quiero saber horarios.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects subject shorter than 5 chars', () => {
    const result = anonymousTicketCreateSchema.safeParse({
      kind: 'consulta',
      contactEmail: 'j@ej.cl',
      subject: 'Hola',
      body: 'Cuerpo válido del mensaje.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects body longer than 5000 chars', () => {
    const result = anonymousTicketCreateSchema.safeParse({
      kind: 'consulta',
      contactEmail: 'j@ej.cl',
      subject: 'Sujeto suplantando identidad',
      body: 'x'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});

describe('authenticatedTicketCreateSchema', () => {
  it('accepts valid report with targetProviderId', () => {
    const result = authenticatedTicketCreateSchema.safeParse({
      kind: 'mal_servicio',
      targetProviderId: 42,
      subject: 'Mal servicio recibido',
      body: 'No llegó a la hora acordada y el trabajo quedó mal hecho.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects consulta kind', () => {
    const result = authenticatedTicketCreateSchema.safeParse({
      kind: 'consulta',
      targetProviderId: 1,
      subject: 'Tengo una consulta',
      body: '¿Atienden los fines de semana?',
    });
    expect(result.success).toBe(false);
  });

  it('rejects without targetProviderId', () => {
    const result = authenticatedTicketCreateSchema.safeParse({
      kind: 'suplantacion',
      subject: 'Suplantación detectada',
      body: 'Este perfil es falso.',
    });
    expect(result.success).toBe(false);
  });
});

describe('ticketTransitionSchema', () => {
  it('accepts valid status transition', () => {
    const result = ticketTransitionSchema.safeParse({ status: 'en_revision' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = ticketTransitionSchema.safeParse({ status: 'invalid_status' });
    expect(result.success).toBe(false);
  });

  it('accepts transition with assigneeAdminId', () => {
    const result = ticketTransitionSchema.safeParse({ status: 'en_revision', assigneeAdminId: 1 });
    expect(result.success).toBe(true);
  });
});

describe('ticketMessageSchema', () => {
  it('accepts valid message', () => {
    const result = ticketMessageSchema.safeParse({ body: 'Gracias por la respuesta.' });
    expect(result.success).toBe(true);
  });

  it('rejects empty body', () => {
    const result = ticketMessageSchema.safeParse({ body: '' });
    expect(result.success).toBe(false);
  });

  it('accepts message with internalNote', () => {
    const result = ticketMessageSchema.safeParse({ body: 'Nota interna', internalNote: true });
    expect(result.success).toBe(true);
  });
});
