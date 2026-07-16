export function hidePageLoader(): void {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  const images = Array.from(
    document.querySelectorAll<HTMLImageElement>('.hero-collage img')
  );
  const fill = loader.querySelector<HTMLElement>('.loader-logo-fill');
  const total = images.length;
  let loaded = 0;

  const finish = (): void => {
    if (loader.classList.contains('loader-hidden')) return;
    loader.classList.add('loader-hidden');
    setTimeout(() => loader.remove(), 600);
  };

  const tick = (): void => {
    loaded++;
    if (fill && total) fill.style.setProperty('--fill', `${Math.round((loaded / total) * 100)}%`);
    if (loaded >= total) finish();
  };

  if (total === 0) {
    finish();
    return;
  }

  for (const img of images) {
    if (img.complete) tick();
    else {
      img.addEventListener('load', tick, { once: true });
      img.addEventListener('error', tick, { once: true });
    }
  }

  // red de seguridad: nunca colgar mas de 3s
  setTimeout(finish, 3000);
}
