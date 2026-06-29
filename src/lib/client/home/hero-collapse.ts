export function initHeroCollapse(): void {
  const wrapper = document.getElementById('hero-section-wrapper');
  if (!wrapper) return;

  let lastScrollY = window.scrollY;
  let ticking = false;
  const COLLAPSE_THRESHOLD = 80;
  const HYSTERESIS = 40;

  function update(): void {
    const currentScrollY = window.scrollY;
    const isCollapsed = wrapper.classList.contains('hero-collapsed');
    const pastThreshold = currentScrollY > COLLAPSE_THRESHOLD;
    const wellPastThreshold = currentScrollY > COLLAPSE_THRESHOLD + HYSTERESIS;

    if (pastThreshold && !isCollapsed) {
      wrapper.classList.add('hero-collapsed');
    } else if (wellPastThreshold && isCollapsed) {
      // keep collapsed
    } else if (!pastThreshold && isCollapsed) {
      wrapper.classList.remove('hero-collapsed');
    } else if (currentScrollY < COLLAPSE_THRESHOLD - HYSTERESIS && isCollapsed) {
      wrapper.classList.remove('hero-collapsed');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  function onScroll(): void {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}
