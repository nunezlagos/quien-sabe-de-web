export function initFiltersToggle(): void {
  const btn = document.getElementById('filters-toggle-btn');
  const layout = document.querySelector<HTMLElement>('.search-layout');
  if (!btn || !layout) return;

  btn.addEventListener('click', () => {
    const open = layout.classList.toggle('filters-open');
    btn.setAttribute('aria-expanded', String(open));
  });
}
