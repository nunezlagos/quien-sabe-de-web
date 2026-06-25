export function initTicketActions() {
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const closeBtn = target.closest('.js-ticket-close') as HTMLElement;
    const assignBtn = target.closest('.js-ticket-assign') as HTMLElement;
    const viewBtn = target.closest('.js-ticket-view') as HTMLElement;

    if (closeBtn) {
      const ticketId = closeBtn.dataset.ticketId;
      if (!ticketId || !confirm('¿Cerrar este ticket?')) return;
      const res = await fetch(`/api/v1/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cerrado' }),
      });
      if (res.ok) location.reload();
      else alert('Error al cerrar ticket');
    }

    if (assignBtn) {
      const ticketId = assignBtn.dataset.ticketId;
      if (!ticketId) return;
      const res = await fetch(`/api/v1/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'en_revision', assigneeAdminId: 'me' }),
      });
      if (res.ok) location.reload();
      else alert('Error al tomar ticket');
    }

    if (viewBtn) {
      const ticketId = viewBtn.dataset.ticketId;
      if (!ticketId) return;
      const ticketDetail = document.getElementById('ticket-detail');
      const list = document.getElementById('ticket-list');
      if (ticketDetail && list) {
        list.classList.add('hidden');
        ticketDetail.classList.remove('hidden');
        const res = await fetch(`/api/v1/tickets/${ticketId}?admin=1`);
        if (res.ok) {
          const data = await res.json();
          renderTicketDetail(data);
        }
      }
    }
  });
}

function renderTicketDetail(data: any) {
  const el = document.getElementById('ticket-detail-content');
  if (!el) return;
  el.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-bold">Ticket #${data.id}</h3>
      <button type="button" class="admin-icon-btn" onclick="document.getElementById('ticket-detail').classList.add('hidden');document.getElementById('ticket-list').classList.remove('hidden')">
        <i class="ri-close-line"></i>
      </button>
    </div>
    <div class="mb-4">
      <p><strong>Tipo:</strong> ${data.kind}</p>
      <p><strong>Estado:</strong> ${data.status}</p>
      <p><strong>Asunto:</strong> ${data.subject}</p>
      <p><strong>Contacto:</strong> ${data.contactEmail || '—'}</p>
      <p><strong>Creado:</strong> ${data.createdAt || '—'}</p>
    </div>
    <h4 class="font-bold text-sm text-gray-600 mb-2">Mensajes</h4>
    <div class="space-y-2">
      ${(data.messages || []).map((m: any) => `
        <div class="p-3 rounded-lg ${m.internalNote ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span class="font-bold">${m.sender}</span>
            ${m.internalNote ? '<span class="text-yellow-600 font-bold">Nota interna</span>' : ''}
          </div>
          <p class="text-sm">${m.body}</p>
        </div>
      `).join('')}
    </div>
    ${data.status !== 'cerrado' ? `
    <form class="mt-4" onsubmit="sendMessage(event, ${data.id})">
      <textarea name="body" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Responder..." required></textarea>
      <label class="flex items-center gap-2 mt-2 text-sm">
        <input type="checkbox" name="internal_note" value="1"> Nota interna (solo visible para admins)
      </label>
      <button type="submit" class="mt-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Enviar</button>
    </form>
    ` : ''}
  `;
}

(window as any).sendMessage = async function(event: Event, ticketId: number) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const body = (form.querySelector('[name="body"]') as HTMLTextAreaElement).value;
  const internalNote = (form.querySelector('[name="internal_note"]') as HTMLInputElement)?.checked || false;

  const res = await fetch(`/api/v1/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, internalNote }),
  });
  if (res.ok) {
    const btn = document.getElementById('ticket-view-btn-' + ticketId) as HTMLElement;
    btn?.click();
  } else {
    alert('Error al enviar mensaje');
  }
};
