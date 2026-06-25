// @ts-nocheck
export function initProviderPreview() {
  const btnPreview = document.getElementById('btn-preview-profile');
  const modal = document.getElementById('preview-modal');
  const closeBtn = document.getElementById('close-preview');
  const previewFrame = document.getElementById('preview-frame') as HTMLIFrameElement | null;

  if (btnPreview && modal && previewFrame) {
    btnPreview.addEventListener('click', () => {
      modal.classList.remove('hidden');
      const slug = btnPreview.dataset.slug;
      previewFrame.src = `/p/${slug}`;
    });
  }
  if (closeBtn && modal && previewFrame) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      previewFrame.src = 'about:blank';
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        previewFrame.src = 'about:blank';
      }
    });
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
