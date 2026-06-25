import type { APIRoute } from 'astro';
import { anonymousTicketCreateSchema, authenticatedTicketCreateSchema } from '../../../../lib/validators/tickets';
import { createTicket, getTicketById } from '../../../../lib/services/tickets';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user || null;
  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  if (!user) {
    const parsed = anonymousTicketCreateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues.map(i => i.message).join(', '), 422);
    const ticket = await createTicket(locals, parsed.data);
    const created = await getTicketById(locals, ticket.id);
    return jsonResponse(created, { status: 201 });
  }

  const parsed = authenticatedTicketCreateSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map(i => i.message).join(', '), 422);

  const ticket = await createTicket(locals, {
    ...parsed.data,
    contactEmail: user.email,
  });
  const created = await getTicketById(locals, ticket.id);
  return jsonResponse(created, { status: 201 });
};
