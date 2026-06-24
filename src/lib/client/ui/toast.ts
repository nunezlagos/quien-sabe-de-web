// src/lib/client/ui/toast.ts
// Helper para mostrar notificaciones efímeras (toast).
// Reusado por AuthButtons, EmailVerificationBanner, formularios de auth, etc.

export type TipoToast = 'info' | 'success' | 'error';

const TOAST_TTL_MS = 3500;

export function mostrarToast(mensaje: string, tipo: TipoToast = 'info'): void {
  const container = document.getElementById('toast-container') ?? crearContenedor();
  const toast = document.createElement('div');
  toast.className = `toast toast--${tipo}`;
  toast.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  toast.textContent = mensaje;
  container.appendChild(toast);

  // Animación de entrada
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, TOAST_TTL_MS);
}

function crearContenedor(): HTMLElement {
  const c = document.createElement('div');
  c.id = 'toast-container';
  c.className = 'toast-container';
  document.body.appendChild(c);
  return c;
}