export function initFavButtons() {
  document.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest('.js-fav-btn');
    if (!btn) return;
    e.preventDefault();
    const slug = (btn as HTMLElement).dataset.favToggle;
    if (!slug) return;

    const res = await fetch('/api/v1/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    if (res.ok) {
      const data = await res.json();
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = data.favorited ? 'ri-heart-fill text-red-500 text-lg' : 'ri-heart-line text-lg';
      }
    } else if (res.status === 401) {
      window.location.href = '/iniciar-sesion?redirigir=' + encodeURIComponent(window.location.pathname);
    }
  });
}
