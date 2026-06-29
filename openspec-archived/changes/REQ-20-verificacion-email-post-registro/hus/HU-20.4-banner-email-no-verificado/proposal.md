# HU-20.4 — Proposal: Banner email no verificado

## Por qué

- El usuario puede olvidarse de verificar el email después del registro.
- Sin verificación, no puede dejar reseñas (HU-09.2) ni guardar favoritos (HU-28.2).
- Un banner persistente pero dismissable es mejor UX que un modal bloqueante.

## Alternativas

| Alternativa | Pro | Contra | Decisión |
|---|---|---|---|
| **Modal bloqueante en cada visita** | Máxima visibilidad | Molesto, mala UX | ❌ |
| **Banner persistente (no dismissable)** | Máxima visibilidad | Ignorado después de 1 semana | ❌ |
| **Banner dismissable por sesión + reenvío inline** | Balance entre visibilidad y respeto al usuario | Más código | ✅ |
| **Email reminder semanal** | Outreach pasivo | Requiere servicio de emails + opt-in | ⚠️ complementario |

## Decisión final

Banner amarillo dismissable por sesión (sessionStorage) con acción inline
de "Reenviar correo" y cooldown de 30s para evitar spam.

## UX del banner

```html
<div id="email-verification-banner" class="email-banner">
  <i class="ri-mail-unread-line email-banner__icon"></i>
  <div class="email-banner__content">
    <h4>Verifica tu correo electrónico</h4>
    <p>Te enviamos un enlace a <b>vecino@demo.cl</b>. Confírmalo para poder dejar reseñas y guardar favoritos.</p>
    <div class="email-banner__actions">
      <button data-action="resend">Reenviar correo</button>
      <a href="/verify-email">Ya lo verifiqué</a>
    </div>
  </div>
  <button data-action="dismiss" aria-label="Cerrar">
    <i class="ri-close-line"></i>
  </button>
</div>
```

## Server-side rendering

El banner se renderiza server-side desde el layout autenticado:

```astro
---
// src/layouts/AuthLayout.astro (nuevo layout para vistas autenticadas)
import EmailVerificationBanner from '../components/auth/EmailVerificationBanner.astro';
const user = Astro.locals.user;
const showBanner = user && !user.email_verified_at;
---
<BaseLayout>
  {showBanner && <EmailVerificationBanner email={user.email} />}
  <slot />
</BaseLayout>
```

## Cliente

```ts
// src/lib/client/auth/email-banner.ts
const DISMISS_KEY = 'email-banner-dismissed';
const COOLDOWN_MS = 30_000;

export function inicializarEmailBanner(): void {
  const banner = document.getElementById('email-verification-banner');
  if (!banner) return;

  // Si dismissed en esta sesión, ocultar
  if (sessionStorage.getItem(DISMISS_KEY) === '1') {
    banner.remove();
    return;
  }

  // X
  banner.querySelector('[data-action="dismiss"]')?.addEventListener('click', () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    banner.remove();
  });

  // Reenviar
  const btnResend = banner.querySelector<HTMLButtonElement>('[data-action="resend"]');
  btnResend?.addEventListener('click', async () => {
    btnResend.disabled = true;
    btnResend.textContent = 'Enviando...';
    try {
      const r = await fetch('/api/v1/auth/verify-email/resend', { method: 'POST' });
      if (r.ok) {
        mostrarToast('Correo reenviado. Revisa tu bandeja.', 'success');
        setTimeout(() => {
          btnResend.disabled = false;
          btnResend.textContent = 'Reenviar correo';
        }, COOLDOWN_MS);
      } else {
        throw new Error('HTTP ' + r.status);
      }
    } catch {
      mostrarToast('No se pudo reenviar. Intenta más tarde.', 'error');
      btnResend.disabled = false;
      btnResend.textContent = 'Reenviar correo';
    }
  });
}
```

## Convenciones aplicadas

- **R1**: estilos del banner en `src/styles/components.css` (clase `.email-banner`)
- **R2**: JS extraído a `src/lib/client/auth/email-banner.ts`
- **R3**: componente `EmailVerificationBanner.astro` reusable + helper server `shouldShowEmailBanner`
- **R4**: PascalCase componente, kebab-case classes