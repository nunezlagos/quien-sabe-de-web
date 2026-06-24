const TRADES = [
  { name: 'Gasfiter', article: 'un' },
  { name: 'Electricista', article: 'un' },
  { name: 'Maestro', article: 'un' },
  { name: 'Jardinero', article: 'un' },
  { name: 'Pintor', article: 'un' },
  { name: 'Costurera', article: 'una' },
  { name: 'Programador', article: 'un' },
];

export function initDynamicText(): void {
  const el = document.getElementById('dynamic-trade');
  if (!el) return;

  let index = 0;

  function cambiar() {
    el.classList.remove('animate-fade-in-up');
    el.classList.add('animate-fade-out-up');

    setTimeout(() => {
      index = (index + 1) % TRADES.length;
      el.textContent = TRADES[index].name;
      el.classList.remove('animate-fade-out-up');
      el.classList.add('animate-fade-in-up');
    }, 500);
  }

  setInterval(cambiar, 3500);
}
