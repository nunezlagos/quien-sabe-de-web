export function initLegalModal(): void {
  const modal = document.getElementById('legal-modal');
  const body = document.getElementById('legal-modal-body');
  const titleEl = document.getElementById('legal-modal-title');
  const openLink = modal?.querySelector<HTMLAnchorElement>('[data-legal-openlink]');
  const triggers = document.querySelectorAll<HTMLAnchorElement>('[data-legal-src]');
  if (!modal || !body || !titleEl || triggers.length === 0) return;

  function close(): void {
    modal!.classList.add('hidden');
    modal!.setAttribute('aria-hidden', 'true');
    body!.innerHTML = '';
  }

  async function open(src: string, title: string): Promise<void> {
    titleEl!.textContent = title;
    if (openLink) openLink.href = src;
    body!.innerHTML = '<p class="legal-modal-loading">Cargando…</p>';
    modal!.classList.remove('hidden');
    modal!.setAttribute('aria-hidden', 'false');

    try {
      const res = await fetch(src);
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const main = doc.querySelector('main');
      if (!main) {
        window.location.href = src;
        return;
      }
      const assets = Array.from(doc.head.querySelectorAll('style, link[rel="stylesheet"]'))
        .filter((el) => {
          if (el.tagName !== 'LINK') return true;
          const href = el.getAttribute('href');
          return !document.querySelector(`link[href="${href}"]`);
        })
        .map((el) => el.outerHTML)
        .join('');
      body!.innerHTML = assets + main.innerHTML;
      body!.scrollTop = 0;
    } catch {
      window.location.href = src;
    }
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      const src = trigger.getAttribute('data-legal-src');
      if (!src) return;
      e.preventDefault();
      open(src, trigger.getAttribute('data-legal-title') ?? 'Documento');
    });
  });

  modal.querySelectorAll('.close-legal').forEach((el) => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) close();
  });
}
