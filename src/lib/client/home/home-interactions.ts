export function initHomeInteractions(): void {
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  const tradeSelect = document.getElementById('trade-select') as HTMLSelectElement | null;
  const communeSelect = document.getElementById('commune-select') as HTMLSelectElement | null;
  const availableNowCheckbox = document.querySelector<HTMLInputElement>('input[name="available_now"]');

  const loginBtn = document.getElementById('loginBtn');
  const loginModal = document.getElementById('login-modal');
  const closeModalBtn = document.querySelector('.close-modal');

  function handleSearch(e?: Event): void {
    if (e) e.preventDefault();

    const keyword = searchInput?.value ?? '';
    const selectedTrade = tradeSelect?.value ?? '';
    const selectedCommune = communeSelect?.value ?? '';

    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (selectedTrade) params.set('trade', selectedTrade);
    if (selectedCommune) params.set('commune', selectedCommune);
    if (availableNowCheckbox?.checked) params.set('available_now', '1');
    window.location.search = params.toString();
  }

  if (searchBtn) searchBtn.addEventListener('click', handleSearch);
  if (searchInput) searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') handleSearch(); });
  if (tradeSelect) tradeSelect.addEventListener('change', handleSearch);
  if (communeSelect) communeSelect.addEventListener('change', handleSearch);

  // View toggle — grid vs list
  const gridViewBtn = document.getElementById('grid-view-btn');
  const listViewBtn = document.getElementById('list-view-btn');
  const neighborsContainer = document.getElementById('neighbors-container');

  if (gridViewBtn && neighborsContainer) {
    gridViewBtn.addEventListener('click', () => {
      neighborsContainer.classList.remove('list-view');
      gridViewBtn.classList.add('view-btn-active');
      gridViewBtn.setAttribute('aria-pressed', 'true');
      if (listViewBtn) {
        listViewBtn.classList.remove('view-btn-active');
        listViewBtn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  if (listViewBtn && neighborsContainer) {
    listViewBtn.addEventListener('click', () => {
      neighborsContainer.classList.add('list-view');
      listViewBtn.classList.add('view-btn-active');
      listViewBtn.setAttribute('aria-pressed', 'true');
      if (gridViewBtn) {
        gridViewBtn.classList.remove('view-btn-active');
        gridViewBtn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  // Login modal
  if (loginBtn && loginModal) {
    loginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
  }
  if (closeModalBtn && loginModal) {
    closeModalBtn.addEventListener('click', () => loginModal.classList.add('hidden'));
  }
  if (loginModal) {
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) loginModal.classList.add('hidden');
    });
  }
}
