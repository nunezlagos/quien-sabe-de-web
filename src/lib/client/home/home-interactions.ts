export function inicializarHomeInteractions(): void {
  const mainBody = document.body;
  const searchSidebar = document.getElementById('search-sidebar');
  const heroSection = document.getElementById('hero-section');
  const heroSearchContainer = document.getElementById('hero-search-container');
  const neighborsContainer = document.getElementById('neighbors-container');
  const noResultsElement = document.getElementById('no-results');
  const gridViewBtn = document.getElementById('grid-view-btn');
  const listViewBtn = document.getElementById('list-view-btn');
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  const tradeSelect = document.getElementById('trade-select') as HTMLSelectElement | null;
  const communeSelect = document.getElementById('commune-select') as HTMLSelectElement | null;

  const loginBtn = document.getElementById('loginBtn');
  const loginModal = document.getElementById('login-modal');
  const closeModalBtn = document.querySelector('.close-modal');

  function enableSearchMode() {
    mainBody.classList.add('search-mode');
    if (searchSidebar) searchSidebar.classList.remove('hidden');
    if (heroSection && !mainBody.classList.contains('search-sticky')) {
      heroSection.style.display = 'none';
    }
    if (heroSearchContainer) {
      heroSearchContainer.style.display = 'none';
    }
    if (neighborsContainer) {
      neighborsContainer.classList.remove('md:grid-cols-2', 'lg:grid-cols-3');
      neighborsContainer.classList.add('grid-cols-1');
    }
    if (listViewBtn) {
      listViewBtn.classList.add('bg-white', 'shadow-sm', 'text-primary');
      listViewBtn.classList.remove('text-gray-400');
    }
    if (gridViewBtn) {
      gridViewBtn.classList.remove('bg-white', 'shadow-sm', 'text-primary');
    }
  }

  function handleSearch(e?: Event) {
    if (e) e.preventDefault();
    enableSearchMode();

    const keyword = searchInput?.value.toLowerCase() ?? '';
    const selectedTrade = tradeSelect?.value ?? '';
    const selectedCommune = communeSelect?.value ?? '';

    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (selectedTrade) params.set('trade', selectedTrade);
    if (selectedCommune) params.set('commune', selectedCommune);
    window.location.search = params.toString();
  }

  if (searchBtn) searchBtn.addEventListener('click', handleSearch);
  if (searchInput) searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') handleSearch(); });
  if (tradeSelect) tradeSelect.addEventListener('change', handleSearch);
  if (communeSelect) communeSelect.addEventListener('change', handleSearch);

  if (gridViewBtn) {
    gridViewBtn.addEventListener('click', () => {
      if (neighborsContainer) {
        neighborsContainer.classList.remove('grid-cols-1');
        neighborsContainer.classList.add('md:grid-cols-2', 'lg:grid-cols-3');
      }
      gridViewBtn.classList.add('bg-white', 'shadow-sm', 'text-primary');
      gridViewBtn.classList.remove('text-gray-400');
      if (listViewBtn) {
        listViewBtn.classList.remove('bg-white', 'shadow-sm', 'text-primary');
        listViewBtn.classList.add('text-gray-400');
      }
    });
  }

  if (listViewBtn) {
    listViewBtn.addEventListener('click', () => {
      if (neighborsContainer) {
        neighborsContainer.classList.remove('md:grid-cols-2', 'lg:grid-cols-3');
        neighborsContainer.classList.add('grid-cols-1');
      }
      listViewBtn.classList.add('bg-white', 'shadow-sm', 'text-primary');
      listViewBtn.classList.remove('text-gray-400');
      if (gridViewBtn) {
        gridViewBtn.classList.remove('bg-white', 'shadow-sm', 'text-primary');
        gridViewBtn.classList.add('text-gray-400');
      }
    });
  }

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
