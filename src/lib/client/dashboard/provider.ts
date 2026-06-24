// src/lib/client/dashboard/provider.ts
// Lógica del dashboard del prestador.
// Extraído de src/pages/dashboard-prestador.astro (regla R2: sin JS inline).

import { mostrarToast } from '../ui/toast';

export function initProviderDashboard(): void {
  initVisibilityToggle();
  initTradeStatusToggle();
  initProfileForm();
  initSupportButton();
}

function initVisibilityToggle(): void {
  const toggle = document.querySelector<HTMLInputElement>('[data-provider-toggle]');
  const label = document.querySelector<HTMLElement>('[data-toggle-label]');
  if (!toggle || !label) return;

  toggle.addEventListener('change', () => {
    label.textContent = toggle.checked ? 'Visible para vecinos' : 'Oculto para vecinos';
    mostrarToast(
      toggle.checked ? 'Tu perfil ahora es visible' : 'Tu perfil está oculto',
      'info',
    );
  });
}

function initTradeStatusToggle(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.js-toggle-status');
  buttons.forEach((boton) => {
    boton.addEventListener('click', async () => {
      const id = boton.dataset.toggleId;
      const statusActual = boton.dataset.toggleStatus ?? 'active';
      const nuevoStatus = statusActual === 'active' ? 'paused' : 'active';
      const accion = nuevoStatus === 'paused' ? 'pausar' : 'activar';

      if (!confirm(`¿Seguro que querés ${accion} este oficio?`)) return;

      boton.disabled = true;
      boton.textContent = '…';

      try {
        const res = await fetch(`/api/v1/trades/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nuevoStatus }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        mostrarToast(`Oficio ${nuevoStatus === 'paused' ? 'pausado' : 'activado'}`, 'success');
        setTimeout(() => window.location.reload(), 600);
      } catch (err) {
        mostrarToast('No se pudo cambiar el estado — endpoint pendiente', 'error');
        boton.disabled = false;
        boton.textContent = statusActual === 'active' ? 'Pausar' : 'Activar';
      }
    });
  });
}

function initProfileForm(): void {
  const form = document.getElementById('form-edit-profile') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const boton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (boton) {
      boton.disabled = true;
      boton.textContent = 'Guardando…';
    }

    try {
      const fd = new FormData(form);
      const res = await fetch('/api/v1/providers/me', {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      mostrarToast('Cambios guardados', 'success');
    } catch (err) {
      mostrarToast('No se pudieron guardar los cambios (endpoint pendiente)', 'error');
    } finally {
      if (boton) {
        boton.disabled = false;
        boton.textContent = 'Guardar cambios';
      }
    }
  });
}

function initSupportButton(): void {
  const link = document.querySelector<HTMLAnchorElement>('a[href="/dashboard-prestador/soporte"]');
  if (!link) return;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    mostrarToast('Próximamente — formulario de tickets en próxima iteración (HU-12.7)', 'info');
  });
}
