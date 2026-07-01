// src/lib/client/auth/account-actions.ts
// Lógica de la página /cuenta (Ley 19.628 — REQ-22).
// Extraído de src/pages/cuenta.astro (regla R2: sin JS inline).
//
// - Modal de confirmación de eliminación (abre/cierra con animación).
// - POST de "Solicitar descarga" (formulario normal del HTML).
// - PATCH por toggle en cada checkbox de consentimiento.
// - DELETE con confirmación "ELIMINAR" tipeada por el usuario.

import { initModal } from '../ui/modal';

const ENDPOINT_CONSENT = '/api/v1/users/me/consent';
const ENDPOINT_DELETE = '/api/v1/users/me';
const CONFIRM_TEXTO = 'ELIMINAR';

export function inicializarAccionesCuenta(): void {
	inicializarModalEliminar();
	inicializarConsentimientos();
}

function inicializarModalEliminar(): void {
	const modal = document.getElementById('delete-modal');
	const contenido = document.getElementById('delete-modal-content');
	if (!modal || !contenido) return;

	const abrir = document.getElementById('open-delete-btn');
	const cerrar = document.getElementById('close-delete-btn');
	const cancelar = document.getElementById('cancel-delete-btn');
	const confirmar = document.getElementById('confirm-delete-btn');
	const input = document.getElementById('delete-confirm-input') as HTMLInputElement | null;
	const formEliminar = document.getElementById('form-eliminar') as HTMLFormElement | null;

	const openers = abrir ? [abrir] : [];
	const closers = [cerrar, cancelar].filter((el): el is HTMLElement => el !== null);

	initModal({
		modal,
		openers,
		closers,
		openClass: 'is-open',
		onOpen: () => {
			input?.focus();
		},
	});

	if (confirmar && input && formEliminar) {
		const refrescar = () => {
			const coincide = input.value.trim() === CONFIRM_TEXTO;
			confirmar.toggleAttribute('disabled', !coincide);
			confirmar.classList.toggle('modal-btn-disabled', !coincide);
		};
		input.addEventListener('input', refrescar);
		refrescar();

		formEliminar.addEventListener('submit', async (e) => {
			e.preventDefault();
			if (input.value.trim() !== CONFIRM_TEXTO) return;
			try {
				confirmar.setAttribute('disabled', 'true');
				const resp = await fetch(ENDPOINT_DELETE, {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ confirm: CONFIRM_TEXTO }),
				});
				if (resp.redirected || resp.ok) {
					window.location.href = resp.url || '/';
					return;
				}
				if (resp.status === 401) {
					window.location.href = '/iniciar-sesion?redirigir=/cuenta';
					return;
				}
				confirmar.removeAttribute('disabled');
			} catch {
				confirmar.removeAttribute('disabled');
			}
		});
	}
}

function inicializarConsentimientos(): void {
	const checks = document.querySelectorAll<HTMLInputElement>('input.js-consent-toggle');
	if (checks.length === 0) return;

	checks.forEach((check) => {
		check.addEventListener('change', () => enviarConsentimientos(checks));
	});
}

async function enviarConsentimientos(checks: NodeListOf<HTMLInputElement>): Promise<void> {
	const cuerpo: Record<string, boolean> = {};
	checks.forEach((c) => {
		const clave = c.dataset.consentKey;
		if (clave) cuerpo[clave] = c.checked;
	});
	try {
		await fetch(ENDPOINT_CONSENT, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(cuerpo),
		});
	} catch {
		// MVP: silencio. UI optimista, revertiremos en la próxima carga si falla.
	}
}
