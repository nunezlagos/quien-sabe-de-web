export function hidePageLoader(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hide);
  } else {
    hide();
  }
}

function hide(): void {
  const loader = document.getElementById('page-loader');
  if (loader) {
    loader.classList.add('loader-hidden');
    setTimeout(() => loader.remove(), 600);
  }
}
