import type { APIRoute } from 'astro';
import { transitionTicket, getTicketById } from '../../../../lib/services/tickets';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const user = (locals as any).user;
  if (!user || user.role !== 'admin') return errorResponse('No autorizado', 403);

  const ticketId = Number(params.id);
  if (!ticketId) return errorResponse('ID inválido', 400);

  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  const { status, assigneeAdminId } = body;
  if (!status || !['abierto', 'en_revision', 'cerrado'].includes(status)) {
    return errorResponse('Estado inválido', 400);
  }

  const current = await getTicketById(locals, ticketId);
  if (!current) return errorResponse('Ticket no encontrado', 404);

  if (current.status === 'cerrado' && status !== 'cerrado') {
    return errorResponse('Transición inválida: ticket cerrado', 409);
  }
  if (current.status === 'en_revision' && status === 'abierto') {
    return errorResponse('Transición inválida: no se puede volver a abierto', 409);
  }

  const adminId = assigneeAdminId === 'me' ? user.id : assigneeAdminId;
  const updated = await transitionTicket(locals, ticketId, status, adminId);

  return jsonResponse(updated);
};
