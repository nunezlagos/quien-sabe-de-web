export function initScrollFab(): void {
  const fab = document.getElementById('scroll-fab');
  const downTarget =
    document.getElementById('recomendados') ?? document.getElementById('results-section');
  if (!fab || !downTarget) {
    fab?.remove();
    return;
  }

  let ticking = false;

  function update(): void {
    const scrolledPastHero = window.scrollY > window.innerHeight * 0.6;
    fab!.classList.toggle('is-up', scrolledPastHero);
    fab!.setAttribute('aria-label', scrolledPastHero ? 'Volver al inicio' : 'Ir a Vecinos Recomendados');
    ticking = false;
  }

  function onScroll(): void {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  fab.addEventListener('click', () => {
    if (fab.classList.contains('is-up')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      downTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}
