export function initFiltersToggle(): void {
  const btn = document.getElementById('filters-toggle-btn');
  const layout = document.querySelector<HTMLElement>('.search-layout');
  if (btn && layout) {
    btn.addEventListener('click', () => {
      const open = layout.classList.toggle('filters-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  }

  const verifiedModal = document.getElementById('verified-modal');
  const verifiedBtn = document.getElementById('verified-modal-btn');
  if (verifiedModal && verifiedBtn) {
    const closeVerified = () => verifiedModal.classList.add('hidden');
    verifiedBtn.addEventListener('click', () => verifiedModal.classList.remove('hidden'));
    verifiedModal.querySelectorAll('.close-verified').forEach((el) => el.addEventListener('click', closeVerified));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !verifiedModal.classList.contains('hidden')) closeVerified();
    });
  }

  const form = document.getElementById('filters-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const current = new URLSearchParams(window.location.search);
    const params = new URLSearchParams();

    // preservar la búsqueda principal (oficio/comuna/palabra clave)
    for (const key of ['q', 'trade', 'commune']) {
      const value = current.get(key);
      if (value) params.set(key, value);
    }

    const data = new FormData(form);
    const priceMin = String(data.get('price_min') ?? '').trim();
    const priceMax = String(data.get('price_max') ?? '').trim();
    if (priceMin) params.set('price_min', priceMin);
    if (priceMax) params.set('price_max', priceMax);
    if (data.get('available_now')) params.set('available_now', '1');
    if (data.get('verified')) params.set('verified', '1');

    window.location.search = params.toString();
  });
}
