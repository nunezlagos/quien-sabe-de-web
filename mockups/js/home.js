document.addEventListener('DOMContentLoaded', () => {
    const neighborsContainer = document.getElementById('neighbors-container');
    if (!neighborsContainer) return; // Only run on Home Page

    const dynamicTradeElement = document.getElementById('dynamic-trade');
    const searchInput = document.getElementById('search-input');
    const tradeSelect = document.getElementById('trade-select');
    const communeSelect = document.getElementById('commune-select');
    const searchBtn = document.getElementById('search-btn');
    const resultsCountElement = document.getElementById('results-count');
    const noResultsElement = document.getElementById('no-results');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('login-modal');
    const closeModalBtn = document.querySelector('.close-modal');

    // Populate Selects
    tradesList.forEach(trade => {
        const option = document.createElement('option');
        option.value = trade.name;
        option.textContent = trade.name;
        tradeSelect.appendChild(option);
    });

    if (communeSelect) {
        communesList.sort().forEach(commune => {
            const option = document.createElement('option');
            option.value = commune;
            option.textContent = commune;
            communeSelect.appendChild(option);
        });
    }

    // --- IMAGE UPLOAD PREVIEW (Generic) ---
    const imageInputs = document.querySelectorAll('input[type="file"]');
    imageInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const container = input.closest('.relative');
                    let img = document.getElementById('avatar-preview');
                    
                    if (!img && container) {
                        img = container.querySelector('img');
                    }
                    
                    if (img) {
                        img.src = e.target.result;
                        img.classList.remove('hidden');
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    });

    // Dynamic Hero Text
    let tradeIndex = 0;
    function changeTradeText() {
        dynamicTradeElement.classList.remove('animate__fadeInDown');
        dynamicTradeElement.classList.add('animate__fadeOutUp');
        
        setTimeout(() => {
            tradeIndex = (tradeIndex + 1) % tradesList.length;
            dynamicTradeElement.textContent = tradesList[tradeIndex].name;
            dynamicTradeElement.classList.remove('animate__fadeOutUp');
            dynamicTradeElement.classList.add('animate__fadeInUp');
        }, 500);
    }
    setInterval(changeTradeText, 3500);

    // Search Mode Logic
    function enableSearchMode() {
        const mainBody = document.getElementById('main-body');
        const searchSidebar = document.getElementById('search-sidebar');
        const heroSearchContainer = document.getElementById('hero-search-container');
        const heroSection = document.getElementById('hero-section');
        
        mainBody.classList.add('search-mode');
        
        if(searchSidebar) searchSidebar.classList.remove('hidden');
        if(heroSection) heroSection.classList.add('hidden');
        if(heroSearchContainer) heroSearchContainer.classList.add('hidden');

        // Force list view layout initially
        neighborsContainer.classList.remove('md:grid-cols-2', 'lg:grid-cols-3');
        neighborsContainer.classList.add('grid-cols-1');
        
        listViewBtn.classList.add('bg-white', 'shadow-sm', 'text-primary');
        gridViewBtn.classList.remove('bg-white', 'shadow-sm', 'text-primary');
    }

    // Create Neighbor Card using Template
    function createNeighborCard(neighbor) {
        const mainBody = document.getElementById('main-body');
        // We are in List Mode if 'search-mode' is active OR (grid-cols-1 is present AND md:grid-cols-2 is NOT present)
        const isListMode = mainBody.classList.contains('search-mode') || 
                           (neighborsContainer.classList.contains('grid-cols-1') && !neighborsContainer.classList.contains('md:grid-cols-2'));
        
        const templateId = isListMode ? 'list-card-template' : 'grid-card-template';
        const template = document.getElementById(templateId);
        const clone = template.content.cloneNode(true);

        // Fill Data
        const article = clone.querySelector('article');
        const avatarImg = clone.querySelector('.avatar-img');
        const avatarInitial = clone.querySelector('.avatar-initial');
        const verifiedBadge = clone.querySelector('.verified-badge');
        
        // Avatar Logic
        if (neighbor.avatar) {
            avatarImg.src = neighbor.avatar;
            avatarImg.alt = neighbor.name;
            avatarImg.classList.remove('hidden');
        } else {
            avatarInitial.textContent = neighbor.name.charAt(0);
            avatarInitial.classList.remove('hidden');
        }

        // Verified Badge (First 3 or explicitly verified)
        if (neighbor.id <= 3 || neighbor.verified) {
            verifiedBadge.classList.remove('hidden');
            verifiedBadge.classList.add('flex');
        } else {
             verifiedBadge.classList.add('hidden');
             verifiedBadge.classList.remove('flex');
        }

        // Text Content
        clone.querySelector('.neighbor-name').textContent = neighbor.name;
        const tradeContainer = clone.querySelector('.neighbor-trade');
        // Clear previous content just in case
        tradeContainer.textContent = ''; 
        // Remove class that makes it look like a single chip if we are going to append multiple
        tradeContainer.className = 'flex flex-wrap gap-1 mt-1'; // Reset class to container style
        
        // Handle both comma and pipe separators
        const trades = neighbor.trade.split(/[,|]/).map(t => t.trim());
        
        // Show max 2 trades + counter
        trades.slice(0, 2).forEach(trade => {
            const chip = document.createElement('span');
            chip.className = 'text-[10px] font-bold uppercase text-white bg-primary/80 backdrop-blur-sm px-2 py-0.5 rounded-full tracking-wider shadow-sm';
            chip.textContent = trade;
            tradeContainer.appendChild(chip);
        });

        if (trades.length > 2) {
            const moreChip = document.createElement('span');
            moreChip.className = 'text-[10px] font-bold uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full tracking-wider shadow-sm';
            moreChip.textContent = `+${trades.length - 2}`;
            tradeContainer.appendChild(moreChip);
        }
        clone.querySelector('.neighbor-rating').innerHTML = renderStars(neighbor.rating);
        
        // Reviews Count (Only in list view or grid header in some designs, check template)
        const reviewsCountEl = clone.querySelector('.neighbor-reviews-count');
        if (reviewsCountEl) reviewsCountEl.textContent = `${neighbor.reviewsCount} opiniones`;

        // Communes
        const communesEl = clone.querySelector('.neighbor-communes');
        if (neighbor.communes && communesEl) {
            if (isListMode) {
                const span = communesEl.querySelector('span');
                span.textContent = neighbor.communes.slice(0, 2).join(', ') + (neighbor.communes.length > 2 ? '...' : '');
                communesEl.classList.remove('hidden');
            } else {
                communesEl.classList.add('hidden');
            }
        }

        // Bio
        const bioText = neighbor.bio.length > 200 ? neighbor.bio.substring(0, 200) + '...' : neighbor.bio;
        const bioEl = clone.querySelector('.neighbor-bio');
        bioEl.textContent = bioText;
        bioEl.title = neighbor.bio; // Tooltip with full text

        // Services Tags
        const servicesContainer = clone.querySelector('.services-container');
        if (servicesContainer) {
            // Show more services (up to 6)
            neighbor.services.slice(0, 6).forEach(s => {
                const tag = document.createElement('span');
                tag.className = 'text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium whitespace-nowrap';
                tag.textContent = s.name;
                servicesContainer.appendChild(tag);
            });
            if (neighbor.services.length > 6) {
                const moreTag = document.createElement('span');
                moreTag.className = 'text-xs text-gray-400 px-1 font-bold';
                moreTag.textContent = `+${neighbor.services.length - 6}`;
                servicesContainer.appendChild(moreTag);
            }
        }

        // Price
        clone.querySelector('.neighbor-price').textContent = formatCurrency(neighbor.basePrice);

        // Links
        const whatsappLink = clone.querySelector('.whatsapp-link');
        if (whatsappLink) whatsappLink.href = `https://wa.me/${neighbor.contact.whatsapp}`;
        
        const profileLink = clone.querySelector('.profile-link');
        if (profileLink) profileLink.href = `profile.html?id=${neighbor.id}`;

        const emailLink = clone.querySelector('.email-link');
        if (emailLink) {
            if (neighbor.contact && neighbor.contact.email) {
                emailLink.href = `mailto:${neighbor.contact.email}`;
                emailLink.classList.remove('hidden');
            } else {
                emailLink.classList.add('hidden');
            }
        }

        return clone;
    }

    // Render & Filter
    function renderNeighbors(data) {
        const mainBody = document.getElementById('main-body');
        // Check logic consistent with createNeighborCard
        const isListMode = mainBody.classList.contains('search-mode') || 
                           (neighborsContainer.classList.contains('grid-cols-1') && !neighborsContainer.classList.contains('md:grid-cols-2'));
        
        neighborsContainer.innerHTML = '';
        
        if (data.length === 0) {
            neighborsContainer.classList.add('hidden');
            noResultsElement.classList.remove('hidden');
            resultsCountElement.textContent = `0 vecinos encontrados`;
            return;
        }

        neighborsContainer.classList.remove('hidden');
        noResultsElement.classList.add('hidden');
        resultsCountElement.textContent = `${data.length} vecino${data.length !== 1 ? 's' : ''} disponible${data.length !== 1 ? 's' : ''}`;

        data.forEach((neighbor, index) => {
            // Insert Ad Banner (Only in List Mode for better layout)
            if (isListMode && index === 2) {
                const adTemplate = document.getElementById('ad-banner-template');
                if (adTemplate) {
                    neighborsContainer.appendChild(adTemplate.content.cloneNode(true));
                }
            }
            neighborsContainer.appendChild(createNeighborCard(neighbor));
        });
    }

    function handleSearch() {
        enableSearchMode();
        const keyword = searchInput.value.toLowerCase();
        const selectedTrade = tradeSelect.value;
        const selectedCommune = communeSelect ? communeSelect.value : "";

        const filtered = neighborsData.filter(neighbor => {
            const matchesTrade = selectedTrade === "" || neighbor.trade === selectedTrade;
            const matchesKeyword = neighbor.name.toLowerCase().includes(keyword) || 
                                   neighbor.bio.toLowerCase().includes(keyword) ||
                                   neighbor.services.some(s => s.name.toLowerCase().includes(keyword));
            const matchesCommune = selectedCommune === "" || (neighbor.communes && neighbor.communes.includes(selectedCommune));

            return matchesTrade && matchesKeyword && matchesCommune;
        });

        renderNeighbors(filtered);
    }

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    tradeSelect.addEventListener('change', handleSearch);
    if(communeSelect) communeSelect.addEventListener('change', handleSearch);

    // View Toggles
    gridViewBtn.addEventListener('click', () => {
        neighborsContainer.classList.remove('grid-cols-1');
        neighborsContainer.classList.add('md:grid-cols-2', 'lg:grid-cols-3');
        
        gridViewBtn.classList.add('bg-white', 'shadow-sm', 'text-primary');
        listViewBtn.classList.remove('bg-white', 'shadow-sm', 'text-primary');
        
        const mainBody = document.getElementById('main-body');
        if (mainBody.classList.contains('search-mode')) {
            handleSearch();
        } else {
            renderNeighbors(neighborsData);
        }
    });

    listViewBtn.addEventListener('click', () => {
        neighborsContainer.classList.remove('md:grid-cols-2', 'lg:grid-cols-3');
        neighborsContainer.classList.add('grid-cols-1');
        
        listViewBtn.classList.add('bg-white', 'shadow-sm', 'text-primary');
        gridViewBtn.classList.remove('bg-white', 'shadow-sm', 'text-primary');
        
        const mainBody = document.getElementById('main-body');
        if (mainBody.classList.contains('search-mode')) {
            handleSearch();
        } else {
            renderNeighbors(neighborsData);
        }
    });

    // Login Modal Redirects
    if (loginBtn) loginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => loginModal.classList.add('hidden'));
    if (loginModal) loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.classList.add('hidden');
    });

    const googleBtn = document.getElementById('login-google-btn');
    const facebookBtn = document.getElementById('login-facebook-btn');

    function loginRedirect(provider) {
        if (provider === 'google') window.location.href = 'dashboard-user.html';
        else if (provider === 'facebook') window.location.href = 'dashboard-provider.html';
    }

    if (googleBtn) googleBtn.addEventListener('click', () => loginRedirect('google'));
    if (facebookBtn) facebookBtn.addEventListener('click', () => loginRedirect('facebook'));

    // Initial Render
    renderNeighbors(neighborsData);
});
