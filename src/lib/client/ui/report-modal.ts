export function initReportModal() {
  const openBtn = document.getElementById('btn-report');
  const modal = document.getElementById('report-modal');
  const closeBtn = document.getElementById('report-modal-close');
  const form = document.getElementById('report-form') as HTMLFormElement;
  const overlay = document.getElementById('report-modal-overlay');

  if (!openBtn || !modal) return;

  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });

  function close() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);

  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    const kind = (form.querySelector('[name="kind"]') as HTMLSelectElement).value;
    const body = (form.querySelector('[name="body"]') as HTMLTextAreaElement).value;
    const targetProviderId = form.dataset.providerId;
    const subject = form.querySelector('[name="subject"]') as HTMLInputElement;

    const res = await fetch('/api/v1/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, subject: subject?.value || body.slice(0, 100), body, targetProviderId: Number(targetProviderId) }),
    });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar Reporte';

    if (res.ok) {
      form.innerHTML = '<div class="text-center py-8"><i class="ri-check-line text-5xl text-green-500 mb-3 block"></i><p class="font-bold text-gray-800">Reporte enviado</p><p class="text-sm text-gray-500 mt-1">Te contactaremos por email.</p></div>';
    } else {
      const err = await res.json();
      submitBtn.textContent = 'Enviar Reporte';
      alert(err.error || 'Error al enviar el reporte');
    }
  });
}
