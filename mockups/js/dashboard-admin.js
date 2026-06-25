document.addEventListener('DOMContentLoaded', () => {
    // --- TABS LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');

    const titles = {
        'dashboard-section': 'Resumen General',
        'users-section': 'Gestión de Usuarios',
        'trades-section': 'Gestión de Oficios',
        'finances-section': 'Finanzas',
        'settings-section': 'Configuración'
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active state from all links
            navLinks.forEach(l => {
                l.classList.remove('active', 'bg-green-50', 'text-primary');
                l.classList.add('inactive', 'text-gray-600');
            });

            // Add active state to clicked link
            link.classList.remove('inactive', 'text-gray-600');
            link.classList.add('active', 'bg-green-50', 'text-primary');

            // Hide all sections
            sections.forEach(section => {
                section.classList.add('hidden');
            });

            // Show target section
            const targetId = link.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if(targetSection) {
                targetSection.classList.remove('hidden');
            }

            // Update Title
            if(titles[targetId]) {
                pageTitle.textContent = titles[targetId];
            }
        });
    });

    // --- MODAL UTILS ---
    function toggleModal(modalId, contentId, show) {
        const modal = document.getElementById(modalId);
        const content = document.getElementById(contentId);
        if (!modal || !content) return;
        
        if (show) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }, 10);
        } else {
            modal.classList.add('opacity-0');
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    }

    // Expose toggleModal globally if needed by inline onclicks (though we are removing them)
    window.toggleModal = toggleModal;

    // User Modal
    const userModalBtn = document.querySelector('button[onclick="openUserModal"]') || document.querySelector('.ri-user-settings-line')?.closest('div')?.querySelector('button');
    const closeUserBtn = document.getElementById('close-user-btn');
    const userModal = document.getElementById('user-modal');

    // We need to attach event listener to the "Nuevo" button if it doesn't have an ID
    // In the HTML it has onclick="toggleModal(...)". We should probably keep using the onclick for now or replace it.
    // The previous script had: 
    // const userModalBtn = document.querySelector('button[onclick="openUserModal"]') || ...
    // But in the HTML I see: <button ... onclick="toggleModal('user-modal', 'user-modal-content', true)">
    // So the previous script logic for userModalBtn might have been for a different version or generic selector.
    // I'll leave the onclick in HTML for simplicity or replace it. 
    // To fully clean HTML, I should add IDs to those buttons and attach listeners here.
    
    // Trade Modal
    const closeTradeBtn = document.getElementById('close-trade-btn');
    const tradeModal = document.getElementById('trade-modal');

    if(closeUserBtn) closeUserBtn.addEventListener('click', () => toggleModal('user-modal', 'user-modal-content', false));
    if(userModal) userModal.addEventListener('click', (e) => { if(e.target === userModal) toggleModal('user-modal', 'user-modal-content', false); });

    if(closeTradeBtn) closeTradeBtn.addEventListener('click', () => toggleModal('trade-modal', 'trade-modal-content', false));
    if(tradeModal) tradeModal.addEventListener('click', (e) => { if(e.target === tradeModal) toggleModal('trade-modal', 'trade-modal-content', false); });

});
