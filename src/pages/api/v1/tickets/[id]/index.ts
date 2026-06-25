import type { APIRoute } from 'astro';
import { getTicketById, listMessages } from '../../../../../lib/services/tickets';
import { errorResponse, jsonResponse } from '../../../../../lib/utils/response';

export const GET: APIRoute = async ({ params, locals, url }) => {
  const user = (locals as any).user || null;
  const ticketId = Number(params.id);
  if (!ticketId) return errorResponse('ID inválido', 400);

  const ticket = await getTicketById(locals, ticketId);
  if (!ticket) return errorResponse('Ticket no encontrado', 404);

  const isAdmin = user?.role === 'admin';
  const isAuthor = user && ticket.createdByUserId === user.id;

  if (!isAdmin && !isAuthor) return errorResponse('No autorizado', 403);

  const messages = await listMessages(locals, ticketId, isAdmin);

  return jsonResponse({ ...ticket, messages });
};
