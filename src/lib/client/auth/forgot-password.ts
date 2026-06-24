// src/lib/client/auth/forgot-password.ts
// Lógica del formulario de recuperar contraseña.
// Patrón espejo de src/lib/client/auth/login.ts (regla R2: sin JS inline).

export function initForgotPasswordForm(): void {
  const form = document.getElementById('form-recuperar') as HTMLFormElement | null;
  const errores = document.getElementById('errores-campos');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(errores);

    const fd = new FormData(form);
    const correo = String(fd.get('correo') ?? '').toLowerCase().trim();

    if (!correo) {
      showErrors(errores, ['Ingresa tu correo electrónico.']);
      return;
    }

    try {
      const resp = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo }),
      });
      if (resp.ok) {
        window.location.href = '/recuperar-contrasena?sent=1';
        return;
      }
      const data = await resp.json().catch(() => ({}));
      showErrors(errores, [data.error || 'No se pudo enviar el enlace. Intenta de nuevo.']);
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