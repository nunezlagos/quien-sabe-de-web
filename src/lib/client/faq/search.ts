// src/lib/client/faq/search.ts
// Filtra preguntas del FAQ en tiempo real según el texto tipeado en el input.
// Reglas:
//  - Match contra título + respuesta (case-insensitive, trim).
//  - Oculta <details> que no matchean (clase `hidden` de Tailwind).
//  - Oculta la categoría padre si TODOS sus items quedan ocultos.
//  - Muestra #faq-no-matches solo si NINGUNA pregunta matchea.

const INPUT_ID = 'faq-search';
const ITEM_SELECTOR = 'details.faq-item';
const NO_MATCHES_ID = 'faq-no-matches';

export function inicializarBusquedaFaq(): void {
  const input = document.getElementById(INPUT_ID) as HTMLInputElement | null;
  const noMatches = document.getElementById(NO_MATCHES_ID);
  if (!input) return;

  const items = Array.from(document.querySelectorAll<HTMLDetailsElement>(ITEM_SELECTOR));
  if (items.length === 0) return;

  const sections = Array.from(
    new Set(items.map((it) => it.closest<HTMLElement>('section[data-category]'))),
  ).filter((s): s is HTMLElement => s !== null);

  const aplicarFiltro = (): void => {
    const query = input.value.trim().toLowerCase();
    let totalVisibles = 0;

    for (const item of items) {
      const texto = item.textContent?.toLowerCase() ?? '';
      const visible = query === '' || texto.includes(query);
      item.classList.toggle('hidden', !visible);
      if (visible) totalVisibles++;
    }

    for (const section of sections) {
      const visiblesEnSeccion = section.querySelectorAll<HTMLElement>(
        `${ITEM_SELECTOR}:not(.hidden)`,
      ).length;
      section.classList.toggle('hidden', visiblesEnSeccion === 0);
    }

    if (noMatches) {
      noMatches.classList.toggle('hidden', totalVisibles > 0);
    }
  };

  input.addEventListener('input', aplicarFiltro);
  aplicarFiltro();
}
