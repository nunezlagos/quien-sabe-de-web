// src/lib/client/auth/restablecer.ts
// Lógica del formulario de restablecer contraseña + toggle show/hide de password.
// Patrón espejo de src/lib/client/auth/login.ts (regla R2: sin JS inline).

import { mostrarToast } from '../ui/toast';

type Requisito = 'length' | 'upper' | 'number';

const REGLAS: Record<Requisito, (valor: string) => boolean> = {
  length: (v) => v.length >= 8,
  upper: (v) => /[A-Z]/.test(v),
  number: (v) => /[0-9]/.test(v),
};

export function inicializarFormularioRestablecer(): void {
  const form = document.getElementById('form-restablecer') as HTMLFormElement | null;
  const errores = document.getElementById('errores-campos');

  inicializarTogglePassword();

  const inputNueva = document.getElementById('nueva-contrasena') as HTMLInputElement | null;
  if (inputNueva) {
    inputNueva.addEventListener('input', () => actualizarRequisitos(inputNueva.value));
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limpiarErrores(errores);

    const fd = new FormData(form);
    const nueva = String(fd.get('nueva-contrasena') ?? '');
    const confirmar = String(fd.get('confirmar-contrasena') ?? '');

    if (!cumpleTodasReglas(nueva)) {
      mostrarErrores(errores, ['La contraseña no cumple todos los requisitos.']);
      return;
    }
    if (nueva !== confirmar) {
      mostrarErrores(errores, ['Las contraseñas no coinciden.']);
      return;
    }

    const token = new URLSearchParams(window.location.search).get('token') ?? '';

    try {
      const resp = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, contrasena: nueva }),
      });
      if (resp.ok) {
        mostrarToast('Contraseña actualizada. Redirigiendo...', 'success');
        setTimeout(() => { window.location.href = '/iniciar-sesion'; }, 800);
        return;
      }
      if (resp.status === 400 || resp.status === 401) {
        window.location.href = '/restablecer-contrasena';
        return;
      }
      const data = await resp.json().catch(() => ({}));
      mostrarErrores(errores, [data.error || 'No se pudo restablecer la contraseña. Intenta de nuevo.']);
    } catch {
      mostrarErrores(errores, ['No se pudo conectar al servidor. Intenta de nuevo.']);
    }
  });
}

function inicializarTogglePassword(): void {
  const toggles = document.querySelectorAll<HTMLButtonElement>('.auth-password-field__toggle');
  toggles.forEach((btn) => {
    if (btn.dataset.toggleWired === 'true') return;
    btn.dataset.toggleWired = 'true';
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      if (!targetId) return;
      const input = document.getElementById(targetId) as HTMLInputElement | null;
      if (!input) return;
      const mostrando = input.type === 'text';
      input.type = mostrando ? 'password' : 'text';
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('ri-eye-line', mostrando);
        icon.classList.toggle('ri-eye-off-line', !mostrando);
      }
      btn.setAttribute('aria-label', mostrando ? 'Mostrar contraseña' : 'Ocultar contraseña');
      btn.setAttribute('aria-pressed', String(!mostrando));
    });
  });
}

function actualizarRequisitos(valor: string): void {
  (Object.keys(REGLAS) as Requisito[]).forEach((req) => {
    setEstadoRequisito(req, REGLAS[req](valor));
  });
}

function setEstadoRequisito(req: Requisito, cumple: boolean): void {
  const item = document.querySelector<HTMLElement>(
    `.auth-requirements__item[data-requirement="${req}"]`,
  );
  if (!item) return;
  item.classList.toggle('auth-requirements__item--ok', cumple);
  item.classList.toggle('auth-requirements__item--fail', !cumple);
  const icon = item.querySelector('i');
  if (icon) {
    icon.classList.toggle('ri-checkbox-circle-fill', cumple);
    icon.classList.toggle('ri-close-circle-line', !cumple);
  }
}

function cumpleTodasReglas(valor: string): boolean {
  return (Object.keys(REGLAS) as Requisito[]).every((req) => REGLAS[req](valor));
}

function limpiarErrores(container: HTMLElement | null): void {
  if (!container) return;
  container.classList.add('auth-card__alert--hidden');
  container.innerHTML = '';
}

function mostrarErrores(container: HTMLElement | null, mensajes: string[]): void {
  if (!container) return;
  container.classList.remove('auth-card__alert--hidden');
  container.innerHTML = mensajes.map((m) => `<div>• ${m}</div>`).join('');
}