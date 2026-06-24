// @ts-nocheck
export function initProviderPreview() {
  const btnPreview = document.getElementById('btn-preview-profile');
  const modal = document.getElementById('preview-modal');
  const closeBtn = document.getElementById('close-preview');
  const previewContent = document.getElementById('preview-content');

  if (btnPreview && modal) {
    btnPreview.addEventListener('click', async () => {
      modal.classList.remove('hidden');
      previewContent.innerHTML = '<div class="flex items-center justify-center py-12"><div class="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div></div>';
      const slug = btnPreview.dataset.slug;
      try {
        const res = await fetch(`/p/${slug}?partial=1`);
        const html = await res.text();
        previewContent.innerHTML = html;
      } catch {
        previewContent.innerHTML = '<p class="text-center text-red-500 py-8">Error al cargar la vista previa.</p>';
      }
    });
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
  }
}

export function initReviewFilters() {
  document.querySelectorAll('[data-filter-reviews]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-reviews]').forEach((b) => {
        b.className = 'text-xs px-3 py-1.5 rounded-lg font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition';
      });
      btn.className = 'text-xs px-3 py-1.5 rounded-lg font-bold bg-orange-500 text-white';
      const filter = btn.dataset.filterReviews;
      document.querySelectorAll('[data-review-id]').forEach((card) => {
        if (filter === 'all') card.style.display = '';
        else card.style.display = card.dataset.reviewStatus === filter ? '' : 'none';
      });
    });
  });
}

export function initReviewResponseForms() {
  document.querySelectorAll('.js-response-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const reviewId = form.dataset.reviewId;
      const response = form.querySelector('textarea[name="response"]').value.trim();
      if (!response) return;
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      try {
        const res = await fetch(`/api/v1/reviews/${reviewId}/response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response }),
        });
        if (res.ok) {
          location.reload();
        } else {
          const data = await res.json();
          alert(data.error || 'Error al enviar respuesta');
        }
      } catch {
        alert('Error de conexión');
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Responder';
    });
  });
}
