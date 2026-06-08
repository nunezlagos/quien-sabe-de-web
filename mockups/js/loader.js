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
                        <div class="relative">
                            <div class="text-5xl md:text-6xl font-extrabold text-gray-200 tracking-tight">
                                Quién<span class="text-gray-200">Sabe</span>
                            </div>
                            <div class="absolute top-0 left-0 text-5xl md:text-6xl font-extrabold text-primary tracking-tight overflow-hidden animate-fill whitespace-nowrap">
                                Quién<span class="text-primary">Sabe</span>
                            </div>
                        </div>
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

document.addEventListener('DOMContentLoaded', initLoader);
