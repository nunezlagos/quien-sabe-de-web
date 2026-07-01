export function initReportModal() {
  const openBtn = document.getElementById('btn-report');
  const modal = document.getElementById('report-modal');
  const closeBtn = document.getElementById('report-modal-close');
  const form = document.getElementById('report-form') as HTMLFormElement;
  const overlay = document.getElementById('report-modal-overlay');

  if (!openBtn || !modal) return;

  let lastFocused: HTMLElement | null = null;

  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function getFocusable(): HTMLElement[] {
    if (!modal) return [];
    return Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null,
    );
  }

  function onKeydown(e: KeyboardEvent) {
    if (!modal) return;
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = getFocusable();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (active && !modal.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function open() {
    if (!modal) return;
    lastFocused = document.activeElement as HTMLElement | null;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown);
    const focusables = getFocusable();
    (focusables[0] ?? modal).focus();
  }

  openBtn.addEventListener('click', open);

  function close() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
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
      form.innerHTML = '<div class="text-center py-8"><i class="ri-check-line text-5xl text-[var(--color-success)] mb-3 block" aria-hidden="true"></i><p class="font-bold text-[var(--text-primary)]">Reporte enviado</p><p class="text-sm text-[var(--text-muted)] mt-1">Te contactaremos por email.</p></div>';
    } else {
      const err = await res.json();
      submitBtn.textContent = 'Enviar Reporte';
      alert(err.error || 'Error al enviar el reporte');
    }
  });
}
