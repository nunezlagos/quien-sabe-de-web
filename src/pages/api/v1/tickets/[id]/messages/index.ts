import type { APIRoute } from 'astro';
import { getTicketById, addMessage } from '../../../../../../lib/services/tickets';
import { errorResponse, jsonResponse } from '../../../../../../lib/utils/response';

export const POST: APIRoute = async ({ params, request, locals }) => {
  const user = (locals as any).user || null;
  const ticketId = Number(params.id);
  if (!ticketId) return errorResponse('ID inválido', 400);

  const ticket = await getTicketById(locals, ticketId);
  if (!ticket) return errorResponse('Ticket no encontrado', 404);

  const isAdmin = user?.role === 'admin';
  const isAuthor = user && ticket.createdByUserId === user.id;
  if (!isAdmin && !isAuthor) return errorResponse('No autorizado', 403);

  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  if (!body.body || typeof body.body !== 'string' || body.body.length < 1 || body.body.length > 5000) {
    return errorResponse('Cuerpo del mensaje inválido (1-5000 caracteres)', 422);
  }

  const internalNote = isAdmin ? (body.internalNote === true) : false;
  const sender = isAdmin ? 'admin' : 'author';

  const message = await addMessage(locals, ticketId, sender, body.body, internalNote);

  return jsonResponse(message, { status: 201 });
};
