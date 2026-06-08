document.addEventListener('DOMContentLoaded', () => {
    const profileContainer = document.getElementById('profile-container');
    if (!profileContainer) return; // Only run on Profile Page

    const errorContainer = document.getElementById('profile-error');
    const params = new URLSearchParams(window.location.search);
    const profileId = parseInt(params.get('id'));

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

    // Email
    const emailBtn = document.getElementById('profile-email-btn');
    if (neighbor.contact.email) {
        emailBtn.href = `mailto:${neighbor.contact.email}`;
        emailBtn.classList.remove('hidden');
    } else {
        emailBtn.classList.add('hidden');
    }

    // Communes
    if (neighbor.communes) {
        document.getElementById('profile-communes').textContent = neighbor.communes.join(', ');
        document.getElementById('profile-communes-container').classList.remove('hidden');
    }

    // Avatar
    const avatarContainer = document.getElementById('profile-avatar-container');
    const verifiedBadge = document.getElementById('profile-verified-badge');
    
    if (neighbor.avatar) {
        avatarContainer.innerHTML = `
            <img src="${neighbor.avatar}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="${neighbor.name}">
        `;
    } else {
        avatarContainer.innerHTML = `
            <div class="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">${neighbor.name.charAt(0)}</div>
        `;
    }

    if (neighbor.id <= 3 || neighbor.verified) {
        verifiedBadge.classList.remove('hidden');
        verifiedBadge.classList.add('flex');
    } else {
        verifiedBadge.classList.add('hidden');
        verifiedBadge.classList.remove('flex');
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
});

// Modal Logic for Public Ticket (exposed globally for HTML onclick if needed, but attached via event listener above too)
// However, the HTML in profile.html has a modal that needs logic.
// The previous logic was inside a <script> in profile.html. We should include it here.

const publicTicketModal = document.getElementById('public-ticket-modal');
const publicTicketContent = document.getElementById('public-ticket-content');
const closePublicTicketBtn = document.getElementById('close-public-ticket');

function openPublicTicket() {
    if (!publicTicketModal) return;
    publicTicketModal.classList.remove('hidden');
    setTimeout(() => {
        publicTicketModal.classList.remove('opacity-0');
        publicTicketContent.classList.remove('scale-95');
        publicTicketContent.classList.add('scale-100');
    }, 10);
}

function closePublicTicket() {
    if (!publicTicketModal) return;
    publicTicketModal.classList.add('opacity-0');
    publicTicketContent.classList.remove('scale-100');
    publicTicketContent.classList.add('scale-95');
    setTimeout(() => {
        publicTicketModal.classList.add('hidden');
    }, 300);
}

if(closePublicTicketBtn) closePublicTicketBtn.addEventListener('click', closePublicTicket);
if(publicTicketModal) publicTicketModal.addEventListener('click', (e) => {
    if(e.target === publicTicketModal) closePublicTicket();
});

// Expose to global scope for script.js to call if needed (though we are moving away from script.js)
window.openPublicTicket = openPublicTicket;
