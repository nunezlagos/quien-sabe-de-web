// src/lib/client/auth/logout.ts
// Lógica del botón de cerrar sesión.
// Wire todos los forms con clase `.js-logout-form` o id `form-cerrar-sesion*`.
// Extraído de BaseLayout.astro y dashboard.astro (regla R2: sin JS inline).

const ENDPOINT = '/api/v1/auth/cerrar-sesion';
const REDIRECT_AFTER = '/';

export function inicializarCerrarSesion(): void {
  const forms = document.querySelectorAll<HTMLFormElement>(
    'form.js-logout-form, form[id^="form-cerrar-sesion"]'
  );
  forms.forEach((form) => {
    if (form.dataset.logoutWired === 'true') return;
    form.dataset.logoutWired = 'true';
    form.addEventListener('submit', handleLogout);
  });
}

async function handleLogout(e: Event): Promise<void> {
  e.preventDefault();
  try {
    await fetch(ENDPOINT, { method: 'POST' });
  } finally {
    window.location.href = REDIRECT_AFTER;
  }
}