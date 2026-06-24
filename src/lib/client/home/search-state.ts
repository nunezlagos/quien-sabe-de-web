export function initSearchState(): void {
  const form = document.getElementById('search-form') as HTMLFormElement | null;
  if (!form) return;

  const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!btn) return;

  const originalHtml = btn.innerHTML;

  form.addEventListener('submit', () => {
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="animate-spin h-5 w-5 inline" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Buscando...
    `;
  });
}
