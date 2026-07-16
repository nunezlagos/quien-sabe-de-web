const TRADES = [
  { name: 'Gasfiter', article: 'un' },
  { name: 'Costurera', article: 'una' },
  { name: 'Electricista', article: 'un' },
  { name: 'Jardinera', article: 'una' },
  { name: 'Pintor', article: 'un' },
  { name: 'Peluquera', article: 'una' },
  { name: 'Carpintero', article: 'un' },
  { name: 'Cocinera', article: 'una' },
];

export function initDynamicText(): void {
  const el = document.getElementById('dynamic-trade');
  if (!el) return;
  const articleEl = document.getElementById('dynamic-article');

  let index = 0;

  function cambiar() {
    if (!el) return;
    el.classList.remove('animate-fade-in-up');
    el.classList.add('animate-fade-out-up');

    setTimeout(() => {
      if (!el) return;
      index = (index + 1) % TRADES.length;
      el.textContent = TRADES[index].name;
      if (articleEl) articleEl.textContent = TRADES[index].article;
      el.classList.remove('animate-fade-out-up');
      el.classList.add('animate-fade-in-up');
    }, 500);
  }

  setInterval(cambiar, 3500);
}
