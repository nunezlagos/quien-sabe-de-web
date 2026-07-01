// @ts-nocheck
import { initModal } from '../ui/modal';

export function initProviderPreview() {
  const btnPreview = document.getElementById('btn-preview-profile');
  const modal = document.getElementById('preview-modal');
  const closeBtn = document.getElementById('close-preview');
  const previewFrame = document.getElementById('preview-frame') as HTMLIFrameElement | null;

  if (!btnPreview || !modal || !previewFrame) return;

  const controller = initModal({
    modal,
    closers: closeBtn ? [closeBtn] : [],
    openClass: 'is-open',
    onOpen: () => {
      const slug = btnPreview.dataset.slug;
      previewFrame.src = `/p/${slug}`;
    },
    onClose: () => {
      previewFrame.src = 'about:blank';
    },
  });

  btnPreview.addEventListener('click', (e) => {
    e.preventDefault();
    controller.open();
  });
}

export function initReviewFilters() {
  const inactiveClass =
    'text-xs px-3 py-1.5 rounded-lg font-bold bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:bg-[var(--border-default)] transition min-h-[44px] inline-flex items-center';
  const activeClass =
    'text-xs px-3 py-1.5 rounded-lg font-bold bg-[var(--orange-500)] text-[var(--text-inverse)] min-h-[44px] inline-flex items-center';

  document.querySelectorAll('[data-filter-reviews]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-reviews]').forEach((b) => {
        b.className = inactiveClass;
        b.setAttribute('aria-pressed', 'false');
      });
      btn.className = activeClass;
      btn.setAttribute('aria-pressed', 'true');
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
