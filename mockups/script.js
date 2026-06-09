document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL LOADER LOGIC ---
    function initLoader() {
        const loader = document.getElementById('page-loader');
        if (!loader) return;

        // Hide after timeout
        setTimeout(() => {
            loader.classList.add('opacity-0');
            setTimeout(() => {
                loader.remove();
            }, 500);
        }, 800);

        // Intercept Links for "Exit" animation
        document.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && link.target !== '_blank') {
                    e.preventDefault();
                    // Show loader again or clone it if removed
                    let exitLoader = document.getElementById('page-loader');
                    if (!exitLoader) {
                        // Re-create simple loader if it was removed
                        exitLoader = document.createElement('div');
                        exitLoader.className = 'fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center animate__animated animate__fadeIn';
                        exitLoader.innerHTML = `
                            <div class="text-5xl md:text-6xl font-extrabold text-primary tracking-tight">QuiénSabe</div>
                            <p class="text-gray-400 text-sm mt-4 font-medium animate-pulse">Cargando...</p>
                        `;
                        document.body.appendChild(exitLoader);
                    } else {
                        exitLoader.classList.remove('opacity-0');
                        exitLoader.classList.remove('transition-opacity');
                        exitLoader.classList.add('animate__animated', 'animate__fadeIn');
                    }
                    
                    setTimeout(() => {
                        window.location.href = href;
                    }, 400);
                }
            });
        });
    }
    initLoader();
    
    // --- Mock Data ---
    const tradesList = [
        { name: 'Gasfiter', article: 'un' },
        { name: 'Electricista', article: 'un' },
        { name: 'Maestro', article: 'un' },
        { name: 'Jardinero', article: 'un' },
        { name: 'Programador', article: 'un' },
        { name: 'Pintor', article: 'un' },
        { name: 'Costurera', article: 'una' }
    ];
    
    const communesList = [
        "Santiago", "Providencia", "Las Condes", "Ñuñoa", "La Florida", 
        "Maipú", "Puente Alto", "La Reina", "Vitacura", "Lo Barnechea",
        "San Miguel", "Estación Central", "Macul", "Peñalolén"
    ];

    const neighborsData = [
        {
            id: 1,
            name: "Juan Pérez",
            trade: "Gasfiter",
            communes: ["Santiago", "Providencia", "Ñuñoa"],
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
            coverImage: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=1200",
            rating: 4.8,
            reviewsCount: 124,
            basePrice: 15000,
            bio: "Gasfiter certificado con 15 años de experiencia. Especialista en detección de fugas, instalación de calefonts y reparaciones de emergencia 24/7. Trabajo limpio y garantizado.",
            services: [
                { name: "Visita y Diagnóstico", price: 15000 },
                { name: "Destape de Cañerías", price: 35000 },
                { name: "Instalación Calefont", price: 45000 },
                { name: "Reparación Fugas", price: 30000 }
            ],
            portfolio: [
                "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=600",
                "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600",
                "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600"
            ],
            reviews: [
                { user: "Ana M.", comment: "Muy puntual y limpio para trabajar. Lo recomiendo totalmente.", rating: 5 },
                { user: "Pedro S.", comment: "Solucionó el problema rápido, aunque llegó un poco tarde.", rating: 4.5 }
            ],
            contact: { phone: "+56911111111", whatsapp: "56911111111" }
        },
        {
            id: 2,
            name: "María González",
            trade: "Electricista",
            communes: ["Las Condes", "Vitacura", "Lo Barnechea"],
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
            coverImage: "https://images.unsplash.com/photo-1621905252507-b35a83013b2b?auto=format&fit=crop&q=80&w=1200",
            rating: 4.9,
            reviewsCount: 89,
            basePrice: 20000,
            bio: "Ingeniera eléctrica certificada SEC Clase A. Realizo desde cambios de enchufes hasta proyectos de iluminación completos. Seguridad y norma ante todo.",
            services: [
                { name: "Cambio de Enchufe/Int.", price: 20000 },
                { name: "Instalación Lámparas", price: 25000 },
                { name: "Certificación TE1", price: 80000 },
                { name: "Tableros Eléctricos", price: 120000 }
            ],
            portfolio: [
                "https://images.unsplash.com/photo-1621905252507-b35a83013b2b?auto=format&fit=crop&q=80&w=600",
                "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&q=80&w=600",
                "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600"
            ],
            reviews: [
                { user: "Luisa K.", comment: "Excelente profesional, me explicó todo el proceso.", rating: 5 },
                { user: "Carlos R.", comment: "Muy ordenada y prolija.", rating: 5 }
            ],
            contact: { phone: "+56922222222", whatsapp: "56922222222" }
        },
        {
            id: 3,
            name: "Pedro Tapia",
            trade: "Jardinero",
            communes: ["La Florida", "Puente Alto", "La Reina"],
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
            coverImage: "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&q=80&w=1200",
            rating: 4.6,
            reviewsCount: 45,
            basePrice: 15000,
            bio: "Paisajista autodidacta con amor por la naturaleza. Mantención de jardines, poda de altura, sistemas de riego y recuperación de áreas verdes.",
            services: [
                { name: "Corte de Pasto", price: 15000 },
                { name: "Poda de Arbustos", price: 20000 },
                { name: "Limpieza y Desmalezado", price: 25000 },
                { name: "Mantención Riego", price: 30000 }
            ],
            portfolio: [
                "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&q=80&w=600",
                "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=600",
                "https://images.unsplash.com/photo-1599689018228-5696c5678229?auto=format&fit=crop&q=80&w=600"
            ],
            reviews: [
                { user: "Marta L.", comment: "Dejó mi jardín hermoso.", rating: 5 }
            ],
            contact: { phone: "+56933333333", whatsapp: "56933333333" }
        },
        {
            id: 4,
            name: "Ana Silva",
            trade: "Costurera",
            rating: 5.0,
            reviewsCount: 210,
            basePrice: 5000,
            communes: ["Santiago", "San Miguel", "Estación Central"],
            coverImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=1200",
            bio: "Arreglos de ropa en general, cambios de cierre, bastas y confecciones a medida. Rápida entrega.",
            services: [
                { name: "Basta pantalón", price: 5000 },
                { name: "Cambio cierre", price: 8000 },
                { name: "Ajuste vestido", price: 12000 }
            ],
            portfolio: [
                "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400"
            ],
            reviews: [],
            contact: { phone: "+56944444444", whatsapp: "56944444444" }
        },
        {
            id: 5,
            name: "Carlos Ruiz",
            trade: "Maestro",
            rating: 4.3,
            reviewsCount: 32,
            basePrice: 30000,
            communes: ["Maipú", "Estación Central", "Santiago"],
            coverImage: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=1200",
            bio: "Maestro chasquilla pro. Hago de todo un poco: albañilería, pintura, cerámica y reparaciones menores.",
            services: [
                { name: "Instalación cerámica", price: 12000 }, // por m2
                { name: "Tabiquería", price: 15000 },
                { name: "Pintura fachada", price: 40000 }
            ],
            portfolio: [],
            reviews: [],
            contact: { phone: "+56955555555", whatsapp: "56955555555" }
        },
        {
            id: 6,
            name: "Luisa Méndez",
            trade: "Programador",
            rating: 4.9,
            reviewsCount: 15,
            basePrice: 25000,
            communes: ["Providencia", "Ñuñoa", "Macul", "Peñalolén"],
            coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200",
            bio: "Te ayudo con la tecnología. Desde arreglar tu PC lento hasta crear la página web de tu emprendimiento.",
            services: [
                { name: "Sitio Web Básico", price: 150000 },
                { name: "Arreglo PC", price: 25000 },
                { name: "Clases Excel", price: 15000 }
            ],
            portfolio: [
                "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400"
            ],
            reviews: [],
            contact: { phone: "+56966666666", whatsapp: "56966666666" }
        }
    ];

    // --- Helpers ---
    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    }

    function renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="ri-star-fill text-yellow-400"></i>';
            } else if (i - 0.5 <= rating) {
                stars += '<i class="ri-star-half-fill text-yellow-400"></i>';
            } else {
                stars += '<i class="ri-star-line text-gray-300"></i>';
            }
        }
        return stars;
    }

    // --- Page Logic Router ---
    const isProfilePage = !!document.getElementById('profile-container');
    const isHomePage = !!document.getElementById('neighbors-container');

    // --- HOME PAGE LOGIC ---
    if (isHomePage) {
        const dynamicTradeElement = document.getElementById('dynamic-trade');
        const searchInput = document.getElementById('search-input');
        const tradeSelect = document.getElementById('trade-select');
        const communeSelect = document.getElementById('commune-select');
        const searchBtn = document.getElementById('search-btn');
        const neighborsContainer = document.getElementById('neighbors-container');
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
            const isSearchMode = mainBody.classList.contains('search-mode') || neighborsContainer.classList.contains('grid-cols-1');
            
            const templateId = isSearchMode ? 'list-card-template' : 'grid-card-template';
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

            // Verified Badge (First 3)
            if (neighbor.id <= 3) {
                verifiedBadge.classList.remove('hidden');
                verifiedBadge.classList.add('flex');
            }

            // Text Content
            clone.querySelector('.neighbor-name').textContent = neighbor.name;
            clone.querySelector('.neighbor-trade').textContent = neighbor.trade;
            clone.querySelector('.neighbor-rating').innerHTML = renderStars(neighbor.rating);
            
            // Reviews Count (Only in list view or grid header in some designs, check template)
            const reviewsCountEl = clone.querySelector('.neighbor-reviews-count');
            if (reviewsCountEl) reviewsCountEl.textContent = `${neighbor.reviewsCount} opiniones`;

            // Communes
            const communesEl = clone.querySelector('.neighbor-communes');
            if (neighbor.communes && communesEl) {
                const span = communesEl.querySelector('span');
                if (isSearchMode) {
                    span.textContent = neighbor.communes.slice(0, 2).join(', ') + (neighbor.communes.length > 2 ? '...' : '');
                } else {
                    span.textContent = `${neighbor.communes[0]} ${neighbor.communes.length > 1 ? `+${neighbor.communes.length - 1}` : ''}`;
                }
                communesEl.classList.remove('hidden');
            }

            // Bio
            clone.querySelector('.neighbor-bio').textContent = neighbor.bio;

            // Services Tags
            const servicesContainer = clone.querySelector('.services-container');
            if (servicesContainer) {
                neighbor.services.slice(0, 3).forEach(s => {
                    const tag = document.createElement('span');
                    tag.className = 'text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium whitespace-nowrap';
                    tag.textContent = s.name;
                    servicesContainer.appendChild(tag);
                });
            }

            // Price
            clone.querySelector('.neighbor-price').textContent = formatCurrency(neighbor.basePrice);

            // Links
            const whatsappLink = clone.querySelector('.whatsapp-link');
            if (whatsappLink) whatsappLink.href = `https://wa.me/${neighbor.contact.whatsapp}`;
            
            const profileLink = clone.querySelector('.profile-link');
            if (profileLink) profileLink.href = `profile.html?id=${neighbor.id}`;

            // Grid View Cover Image
            if (!isSearchMode) {
                const coverImageDiv = clone.querySelector('.cover-image');
                if (coverImageDiv) {
                    if (neighbor.coverImage) {
                        coverImageDiv.style.backgroundImage = `url('${neighbor.coverImage}')`;
                        coverImageDiv.style.backgroundSize = 'cover';
                        coverImageDiv.style.backgroundPosition = 'center';
                    } else {
                        coverImageDiv.style.background = 'linear-gradient(to right, #2E8B57, #4ade80)';
                    }
                }
            }

            return clone;
        }

        // Render & Filter
        function renderNeighbors(data) {
            const mainBody = document.getElementById('main-body');
            const isSearchMode = mainBody.classList.contains('search-mode');
            
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
                // Insert Ad Banner
                if (isSearchMode && index === 2) {
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
            
            // Re-render to switch templates
            // We need to re-filter or just use current data? 
            // For simplicity, re-run search/filter logic or just render all if no search active
            // Ideally we should store currentFilteredData. 
            // Let's just trigger handleSearch if in search mode, otherwise render all.
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
    }

    // --- PROFILE PAGE LOGIC ---
    if (isProfilePage) {
        const params = new URLSearchParams(window.location.search);
        const profileId = parseInt(params.get('id'));
        const profileContainer = document.getElementById('profile-container');
        const errorContainer = document.getElementById('profile-error');

        const neighbor = neighborsData.find(n => n.id === profileId);

        if (!neighbor) {
            errorContainer.classList.remove('hidden');
            return;
        }

        profileContainer.classList.remove('hidden');

        // Populate Basic Info
        document.getElementById('profile-name').textContent = neighbor.name;
        document.getElementById('profile-trade').textContent = neighbor.trade;
        document.getElementById('profile-stars').innerHTML = renderStars(neighbor.rating);
        document.getElementById('profile-rating-text').textContent = `(${neighbor.rating})`;
        document.getElementById('profile-reviews-count').textContent = neighbor.reviewsCount;
        document.getElementById('profile-bio').textContent = neighbor.bio;
        
        // Whatsapp
        document.getElementById('profile-whatsapp-btn').href = `https://wa.me/${neighbor.contact.whatsapp}`;

        // Communes
        if (neighbor.communes) {
            document.getElementById('profile-communes').textContent = neighbor.communes.join(', ');
            document.getElementById('profile-communes-container').classList.remove('hidden');
        }

        // Banner
        const banner = document.getElementById('profile-banner');
        if (neighbor.coverImage) {
            banner.style.backgroundImage = `url('${neighbor.coverImage}')`;
            banner.style.backgroundSize = 'cover';
            banner.style.backgroundPosition = 'center';
        } else {
            banner.style.background = 'linear-gradient(to right, #2E8B57, #4ade80)';
        }

        // Avatar
        const avatarContainer = document.getElementById('profile-avatar-container');
        // Clear previous content just in case
        // avatarContainer.innerHTML = ''; // Actually it has placeholders or we replace content
        // We can just use innerHTML for this small part or create elements
        if (neighbor.avatar) {
            avatarContainer.innerHTML = `
                <img src="${neighbor.avatar}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="${neighbor.name}">
                ${neighbor.id <= 3 ? `<div class="absolute bottom-1 right-1 bg-blue-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-white z-10" title="Verificado"><i class="ri-check-line"></i></div>` : ''}
            `;
        } else {
            avatarContainer.innerHTML = `
                <div class="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">${neighbor.name.charAt(0)}</div>
                ${neighbor.id <= 3 ? `<div class="absolute bottom-1 right-1 bg-blue-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-white z-10" title="Verificado"><i class="ri-check-line"></i></div>` : ''}
            `;
        }

        // Services List
        const servicesListEl = document.getElementById('profile-services-list');
        const serviceTemplate = document.getElementById('service-item-template');
        neighbor.services.forEach(service => {
            const clone = serviceTemplate.content.cloneNode(true);
            clone.querySelector('.service-name').textContent = service.name;
            clone.querySelector('.service-price').textContent = `~${formatCurrency(service.price)}`;
            servicesListEl.appendChild(clone);
        });

        // Portfolio
        const portfolioContainer = document.getElementById('profile-portfolio-container');
        const portfolioItemTemplate = document.getElementById('portfolio-item-template');
        const portfolioGridTemplate = document.getElementById('portfolio-grid-template');
        const emptyTemplate = document.getElementById('empty-state-template');

        if (neighbor.portfolio && neighbor.portfolio.length > 0) {
            const gridClone = portfolioGridTemplate.content.cloneNode(true);
            const grid = gridClone.querySelector('.portfolio-grid');
            
            neighbor.portfolio.slice(0, 5).forEach(img => {
                const itemClone = portfolioItemTemplate.content.cloneNode(true);
                itemClone.querySelector('.portfolio-img').src = img;
                grid.appendChild(itemClone);
            });
            portfolioContainer.appendChild(gridClone);
        } else {
            const emptyClone = emptyTemplate.content.cloneNode(true);
            emptyClone.querySelector('.empty-message').textContent = "Este vecino aún no ha subido fotos de sus trabajos.";
            portfolioContainer.appendChild(emptyClone);
        }

        // Reviews
        const reviewsContainer = document.getElementById('profile-reviews-container');
        const reviewItemTemplate = document.getElementById('review-item-template');

        if (neighbor.reviews && neighbor.reviews.length > 0) {
            neighbor.reviews.forEach(review => {
                const clone = reviewItemTemplate.content.cloneNode(true);
                clone.querySelector('.review-user').textContent = review.user;
                clone.querySelector('.review-stars').innerHTML = renderStars(review.rating);
                clone.querySelector('.review-comment').textContent = `"${review.comment}"`;
                reviewsContainer.appendChild(clone);
            });
        } else {
            const emptyClone = emptyTemplate.content.cloneNode(true);
            emptyClone.querySelector('.empty-message').textContent = "Aún no hay reseñas escritas.";
            reviewsContainer.appendChild(emptyClone);
        }

        // Public Ticket Modal Logic
        const reportBtn = document.getElementById('report-btn');
        if (reportBtn) {
            reportBtn.addEventListener('click', () => {
                if (window.openPublicTicket) window.openPublicTicket();
            });
        }
    }
});
