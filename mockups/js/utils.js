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
