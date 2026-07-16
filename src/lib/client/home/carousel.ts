export function initCarousel(trackId: string): void {
  const found = document.getElementById(trackId);
  if (!found) return;
  const track: HTMLElement = found;

  const items = Array.from(track.children) as HTMLElement[];
  const dotsBox = document.querySelector<HTMLElement>(`[data-dots="${trackId}"]`);
  const prev = document.querySelector<HTMLElement>(`[data-prev="${trackId}"]`);
  const next = document.querySelector<HTMLElement>(`[data-next="${trackId}"]`);
  if (!items.length) return;

  const step = (): number => items[0].getBoundingClientRect().width + 16;

  const dots: HTMLButtonElement[] = [];
  if (dotsBox) {
    items.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `Ir a la tarjeta ${i + 1}`);
      dot.addEventListener('click', () => {
        track.scrollTo({ left: i * step(), behavior: 'smooth' });
        restart();
      });
      dotsBox.appendChild(dot);
      dots.push(dot);
    });
  }

  function setActive(): void {
    const index = Math.round(track.scrollLeft / step());
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  }

  let ticking = false;
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      setActive();
      ticking = false;
    });
  }, { passive: true });

  function advance(): void {
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step(), behavior: 'smooth' });
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = 0;
  function start(): void {
    if (reduceMotion) return;
    timer = window.setInterval(advance, 4000);
  }
  function stop(): void {
    window.clearInterval(timer);
  }
  function restart(): void {
    stop();
    start();
  }

  prev?.addEventListener('click', () => {
    track.scrollBy({ left: -step(), behavior: 'smooth' });
    restart();
  });
  next?.addEventListener('click', () => {
    track.scrollBy({ left: step(), behavior: 'smooth' });
    restart();
  });

  track.addEventListener('pointerenter', stop);
  track.addEventListener('pointerleave', start);

  setActive();
  start();
}
