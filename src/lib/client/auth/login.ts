// src/lib/client/auth/login.ts
// Lógica del formulario de login.
// Extraído de src/pages/iniciar-sesion.astro (regla R2: sin JS inline).

import { mostrarToast } from '../ui/toast';

export function showComingSoon(provider: string): void {
  const displayName = provider.charAt(0).toUpperCase() + provider.slice(1);
  mostrarToast(`Próximamente — en esta demo solo email + contraseña (${displayName} no disponible)`, 'info');
}

export function initLoginForm(): void {
  const form = document.getElementById('form-login') as HTMLFormElement | null;
  const errores = document.getElementById('errores-campos');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(errores);
    const fd = new FormData(form);
    const cuerpo = {
      correo: String(fd.get('correo') ?? '').toLowerCase().trim(),
      contrasena: String(fd.get('contrasena') ?? ''),
    };
    try {
      const resp = await fetch('/api/v1/auth/iniciar-sesion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      if (resp.ok) {
        const redirigir = form.dataset.redirigir || '/dashboard';
        window.location.href = redirigir;
        return;
      }
      const messages = await mapLoginErrors(resp);
      showErrors(errores, messages);
    } catch {
      showErrors(errores, ['No se pudo conectar al servidor. Intenta de nuevo.']);
    }
  });
}

function clearErrors(container: HTMLElement | null): void {
  if (!container) return;
  container.classList.add('auth-card__alert--hidden');
  container.innerHTML = '';
}

function showErrors(container: HTMLElement | null, messages: string[]): void {
  if (!container) return;
  container.classList.remove('auth-card__alert--hidden');
  container.innerHTML = messages.map((m) => `<div>• ${m}</div>`).join('');
}

async function mapLoginErrors(resp: Response): Promise<string[]> {
  if (resp.status === 401) return ['Credenciales inválidas. Revisa tu correo y contraseña.'];
  if (resp.status === 403) return ['Tu cuenta está deshabilitada. Contacta a soporte.'];
  const data = await resp.json().catch(() => ({}));
  return [data.error || 'No se pudo iniciar sesión. Intenta de nuevo.'];
}