// src/lib/client/trades/create-trade.ts
// Lógica del formulario de creación de oficios.
// Extraído de src/pages/crear-oficio.astro (regla R2: sin JS inline).

export function initCreateTradeForm(): void {
  initOtherTrade();
  initUploadCert();
  initWhatsAppValidation();
}

function initOtherTrade(): void {
  const select = document.querySelector<HTMLSelectElement>('.js-oficio-select');
  const wrap = document.querySelector<HTMLElement>('[data-oficio-otro]');
  const inputCustom = document.getElementById('symbol_custom') as HTMLInputElement | null;
  if (!select || !wrap || !inputCustom) return;

  const toggle = () => {
    if (select.value === 'otro') {
      wrap.hidden = false;
      wrap.setAttribute('aria-hidden', 'false');
      inputCustom.disabled = false;
      inputCustom.required = true;
    } else {
      wrap.hidden = true;
      wrap.setAttribute('aria-hidden', 'true');
      inputCustom.required = false;
      inputCustom.disabled = true;
      inputCustom.value = '';
    }
  };
  toggle();
  select.addEventListener('change', toggle);
}

function initUploadCert(): void {
  const dropzone = document.querySelector<HTMLElement>('.js-upload-cert');
  if (!dropzone) return;
  dropzone.addEventListener('click', (e) => {
    e.preventDefault();
    const toast = document.querySelector('.toast-container');
    if (!toast) return;
    const msg = document.createElement('div');
    msg.className = 'toast toast--info toast--visible';
    msg.setAttribute('role', 'status');
    msg.textContent = 'Próximamente — upload de certificados en HU-12.6';
    toast.appendChild(msg);
    setTimeout(() => {
      msg.classList.remove('toast--visible');
      setTimeout(() => msg.remove(), 300);
    }, 3500);
  });
}

function initWhatsAppValidation(): void {
  const input = document.getElementById('whatsapp') as HTMLInputElement | null;
  if (!input) return;

  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 8);
  });
}
