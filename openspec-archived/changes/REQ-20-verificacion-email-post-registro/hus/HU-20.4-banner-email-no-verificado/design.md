# HU-20.4 — Design: Banner email no verificado

## Estructura de archivos

```
src/
├── components/
│   └── auth/
│       └── EmailVerificationBanner.astro    ← NUEVO
├── lib/
│   ├── services/
│   │   └── auth/
│   │       └── email-verification.ts       ← NUEVO, helper server
│   └── client/
│       └── auth/
│           └── email-banner.ts             ← NUEVO, lógica cliente
├── layouts/
│   └── AuthLayout.astro                    ← NUEVO, layout autenticado
└── styles/
    └── components.css                      ← EXTENDER, agregar .email-banner

mockups/
└── dashboard-user.html                     ← YA TIENE banner insertado (línea 28)
```

## Server-side

```ts
// src/lib/services/auth/email-verification.ts
export function shouldShowEmailBanner(user: { email_verified_at: Date | null } | null | undefined): boolean {
  if (!user) return false;
  return user.email_verified_at === null;
}
```

```astro
---
// src/components/auth/EmailVerificationBanner.astro
interface Props {
  email: string;
}
const { email } = Astro.props;
---
<div id="email-verification-banner" class="email-banner">
  <i class="ri-mail-unread-line email-banner__icon" aria-hidden="true"></i>
  <div class="email-banner__content">
    <h4 class="email-banner__title">Verifica tu correo electrónico</h4>
    <p class="email-banner__text">
      Te enviamos un enlace a <b>{email}</b>. Confírmalo para poder dejar reseñas y guardar favoritos.
    </p>
    <div class="email-banner__actions">
      <button type="button" data-action="resend" class="email-banner__btn email-banner__btn--primary">
        Reenviar correo
      </button>
      <a href="/verify-email" class="email-banner__link">Ya lo verifiqué</a>
    </div>
  </div>
  <button type="button" data-action="dismiss" class="email-banner__dismiss" aria-label="Cerrar banner">
    <i class="ri-close-line" aria-hidden="true"></i>
  </button>
</div>

<script>
  import { inicializarEmailBanner } from '../../lib/client/auth/email-banner';
  inicializarEmailBanner();
</script>
```

## Estilos (R1)

```css
/* src/styles/components.css */
.email-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  background: var(--color-yellow-50);
  border: 2px solid var(--color-yellow-200);
  border-radius: var(--radius-2xl);
}

.email-banner__icon {
  color: var(--color-yellow-700);
  font-size: var(--text-2xl);
  flex-shrink: 0;
  margin-top: 2px;
}

.email-banner__content { flex: 1; }

.email-banner__title {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-yellow-900);
  margin-bottom: var(--space-1);
}

.email-banner__text {
  font-size: var(--text-xs);
  color: var(--color-yellow-800);
}

.email-banner__actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.email-banner__btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-xs);
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background-color 200ms;
}

.email-banner__btn--primary {
  background: var(--color-yellow-600);
  color: white;
}
.email-banner__btn--primary:hover { background: var(--color-yellow-700); }
.email-banner__btn--primary:disabled {
  background: var(--color-yellow-300);
  cursor: not-allowed;
}

.email-banner__link {
  color: var(--color-yellow-700);
  font-size: var(--text-xs);
  font-weight: 700;
  text-decoration: underline;
}

.email-banner__dismiss {
  background: transparent;
  border: none;
  color: var(--color-yellow-700);
  cursor: pointer;
  padding: 0;
  font-size: var(--text-xl);
}
.email-banner__dismiss:hover { color: var(--color-yellow-900); }
```

## Tests

### Unit (`tests/unit/services/auth/email-verification.test.ts`)

- `shouldShowEmailBanner(null)` → `false`
- `shouldShowEmailBanner({ email_verified_at: null })` → `true`
- `shouldShowEmailBanner({ email_verified_at: new Date() })` → `false`

### Integración (`tests/integration/auth/email-banner-render.test.ts`)

- GET `/dashboard` con sesión `email_verified_at=null` → HTML contiene `#email-verification-banner`
- GET `/dashboard` con sesión `email_verified_at=now` → HTML NO contiene `#email-verification-banner`

### E2E (`tests/e2e/email-verification-banner.spec.ts`)

- Login vecino → ve banner amarillo
- Click X → banner desaparece
- Reload → banner reaparece
- Click "Reenviar correo" → ve toast, botón se desactiva 30s

## Convenciones aplicadas

- R1 ✓ (estilos en `components.css`)
- R2 ✓ (JS en `src/lib/client/auth/email-banner.ts`)
- R3 ✓ (componente reusable + helper server-side)
- R4 ✓ (PascalCase + kebab-case con prefijo `email-banner-`)