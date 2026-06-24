// src/lib/client/donations/donar.ts
// Lógica del formulario de donaciones (selector de monto + custom).
// Extraído de src/pages/donar.astro (regla R2: sin JS inline).

export function inicializarFormularioDonar(): void {
  const form = document.getElementById('form-donar') as HTMLFormElement | null;
  const hiddenAmount = document.getElementById('donation-amount') as HTMLInputElement | null;
  const custom = document.getElementById('custom_amount') as HTMLInputElement | null;
  const buttons = document.querySelectorAll<HTMLButtonElement>('.js-monto');
  if (!form || !hiddenAmount || !custom) return;

  const syncHidden = (value: string) => {
    hiddenAmount.value = value;
    const n = Number(value);
    custom.value = Number.isFinite(n) && n > 0 ? String(n) : '';
    buttons.forEach((b) => {
      const isActive = Number(b.dataset.amount ?? 0) === Number(value);
      b.classList.toggle('border-orange-500', isActive);
      b.classList.toggle('bg-orange-50', isActive);
      b.classList.toggle('border-orange-200', !isActive);
    });
  };

  buttons.forEach((b) => {
    b.addEventListener('click', () => {
      const amount = b.dataset.amount ?? '';
      syncHidden(amount);
    });
  });

  custom.addEventListener('input', () => {
    const n = Number(custom.value);
    if (Number.isFinite(n) && n >= 1000) {
      hiddenAmount.value = String(n);
      buttons.forEach((b) => {
        b.classList.remove('border-orange-500', 'bg-orange-50');
        b.classList.add('border-orange-200');
      });
    } else {
      hiddenAmount.value = '';
    }
  });

  form.addEventListener('submit', (e) => {
    if (!hiddenAmount.value || Number(hiddenAmount.value) < 1000) {
      e.preventDefault();
      const toast = document.querySelector('.toast-container');
      if (!toast) return;
      const msg = document.createElement('div');
      msg.className = 'toast toast--error toast--visible';
      msg.setAttribute('role', 'alert');
      msg.textContent = 'Elegí un monto de al menos $1.000';
      toast.appendChild(msg);
      setTimeout(() => {
        msg.classList.remove('toast--visible');
        setTimeout(() => msg.remove(), 300);
      }, 3500);
    }
  });
}
