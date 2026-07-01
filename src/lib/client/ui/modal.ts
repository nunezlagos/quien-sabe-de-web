// src/lib/client/ui/modal.ts
// Helper de modal accesible reutilizable.
// Comportamiento: abrir/cerrar con openClass, ESC, click en backdrop,
// focus-trap (Tab/Shift+Tab), restaura el foco al cerrar y foca el
// primer focuseable al abrir. Robusto ante elementos faltantes.

export interface InitModalOptions {
  /** Contenedor raíz del modal. */
  modal: HTMLElement;
  /** Elementos que abren el modal al hacer click. */
  openers?: HTMLElement[];
  /** Elementos que cierran el modal al hacer click. */
  closers?: HTMLElement[];
  /** Callback tras abrir. */
  onOpen?: () => void;
  /** Callback tras cerrar. */
  onClose?: () => void;
  /** Clase que marca el modal como abierto. Default: 'is-open'. */
  openClass?: string;
}

export interface ModalController {
  open: () => void;
  close: () => void;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(modal: HTMLElement): HTMLElement[] {
  const nodes = modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(nodes).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

export function initModal(opts: InitModalOptions): ModalController {
  const { modal, onOpen, onClose } = opts;
  const openers = opts.openers ?? [];
  const closers = opts.closers ?? [];
  const openClass = opts.openClass ?? 'is-open';

  let isOpen = false;
  let lastFocused: HTMLElement | null = null;

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab') {
      trapFocus(e);
    }
  }

  function trapFocus(e: KeyboardEvent): void {
    const focusable = getFocusable(modal);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || !modal.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !modal.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function handleBackdropClick(e: MouseEvent): void {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (
      target.matches('[data-modal-backdrop], .modal-backdrop') &&
      modal.contains(target)
    ) {
      close();
    }
  }

  function open(): void {
    if (isOpen) return;
    isOpen = true;
    lastFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    modal.classList.add(openClass);
    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden', 'false');

    document.addEventListener('keydown', handleKeydown);
    modal.addEventListener('click', handleBackdropClick);

    const focusable = getFocusable(modal);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      modal.focus();
    }

    onOpen?.();
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;

    modal.classList.remove(openClass);
    modal.setAttribute('aria-hidden', 'true');

    document.removeEventListener('keydown', handleKeydown);
    modal.removeEventListener('click', handleBackdropClick);

    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
    lastFocused = null;

    onClose?.();
  }

  openers.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      open();
    });
  });

  closers.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      close();
    });
  });

  return { open, close };
}
