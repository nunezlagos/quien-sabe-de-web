# HU-01.8 — Proposal: Vista standalone `/iniciar-sesion`

## Por qué

- `src/pages/iniciar-sesion.astro` ya existe pero:
  1. Tiene un `<script>` inline con toda la lógica del form (viola R2).
  2. No tiene los botones OAuth visual-only que sí tiene el modal de `index.html`.
  3. No redirige si ya hay sesión activa.
- Los mockups no tienen una vista standalone de login que el equipo de diseño pueda revisar.

## Alternativas

| Alternativa | Pro | Contra | Decisión |
|---|---|---|---|
| **Mantener el form solo en el modal de `index.html`** | Sin código nuevo | Login no es accesible por URL directa | ❌ |
| **Reutilizar `iniciar-sesion.astro` y agregar solo lo que falta** | Mínimo código nuevo | Sigue con JS inline (viola R2) | ❌ |
| **Reescribir `iniciar-sesion.astro` + crear `AuthButtons.astro` componente + mockup `login.html`** | Cumple R1/R2/R3; el componente es reusable; el mockup da feedback visual | Más trabajo inicial | ✅ |

## Decisión final

Refactor + componente + mockup.

## Componentes

### `src/components/auth/AuthButtons.astro`

```astro
---
interface Props {
  mode?: 'compact' | 'full';
  redirigirAcceso?: string;
}
const { mode = 'full', redirigirAcceso = '/dashboard' } = Astro.props;
---
<div class="auth-buttons auth-buttons--{mode}">
  <button type="button"
          class="auth-buttons__btn auth-buttons__btn--google"
          aria-disabled="true"
          title="Próximamente"
          data-provider="google">
    <i class="ri-google-fill"></i> Continuar con Google
  </button>
  <button type="button"
          class="auth-buttons__btn auth-buttons__btn--facebook"
          aria-disabled="true"
          title="Próximamente"
          data-provider="facebook">
    <i class="ri-facebook-fill"></i> Continuar con Facebook
  </button>
  <a href={redirigirAcceso}
     class="auth-buttons__btn auth-buttons__btn--corporate">
    <i class="ri-dashboard-3-line"></i> Acceso Corporativo / Admin
  </a>
</div>
<script>
  import { mostrarProximamente } from '../../lib/client/auth/login';
  document.querySelectorAll('[data-provider]').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.getAttribute('data-provider') ?? '';
      mostrarProximamente(provider);
    });
  });
</script>
```

### `src/lib/client/auth/login.ts`

```ts
// src/lib/client/auth/login.ts
export function mostrarProximamente(provider: string): void {
  // toast simple
  alert(`Próximamente — en esta demo solo email + contraseña (${provider} no disponible)`);
}

export function inicializarFormularioLogin(): void {
  const form = document.getElementById('form-login') as HTMLFormElement | null;
  if (!form) return;
  // ... lógica extraída del <script> actual
}
```

## Vista refactorizada

```astro
---
// src/pages/iniciar-sesion.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import AuthButtons from '../components/auth/AuthButtons.astro';

const url = Astro.url;
const redirigir = url.searchParams.get('redirigir') ?? '/dashboard';
const error = url.searchParams.get('error');

// Si ya hay sesión, redirigir
const sessionUser = Astro.locals.user;
if (sessionUser) {
  return Astro.redirect(redirigir);
}
---
<BaseLayout title="Iniciar sesión — QuiénSabe">
  <main class="auth-page">
    <a href="/" class="auth-page__back">← Volver al inicio</a>
    <article class="auth-card">
      <h1 class="auth-card__title">Inicia sesión</h1>
      <p class="auth-card__subtitle">Vuelve a conectar con tus vecinos.</p>

      {error && <div class="auth-card__alert auth-card__alert--error">{error}</div>}

      <form id="form-login" class="auth-form" data-redirigir={redirigir}>
        <label class="auth-form__label" for="correo">Correo</label>
        <input id="correo" name="correo" type="email" required class="auth-form__input">

        <label class="auth-form__label" for="contrasena">Contraseña</label>
        <input id="contrasena" name="contrasena" type="password" required class="auth-form__input">

        <div id="errores-campos" class="auth-card__alert auth-card__alert--error auth-card__alert--hidden"></div>

        <button type="submit" class="btn btn--primary btn--block">Iniciar sesión</button>
      </form>

      <div class="auth-card__divider"><span>O continúa con</span></div>

      <AuthButtons mode="full" redirigirAcceso={redirigir} />

      <p class="auth-card__legal">
        Al iniciar sesión aceptas nuestras <a href="/terminos">normas de convivencia</a>.
      </p>

      <p class="auth-card__alt">
        ¿No tienes cuenta? <a href="/registro">Crea una</a>
      </p>
    </article>
  </main>
</BaseLayout>

<script>
  import { inicializarFormularioLogin } from '../lib/client/auth/login';
  inicializarFormularioLogin();
</script>
```

## Mockup `mockups/login.html`

Mockup estático standalone, sin lógica JS, reutilizando el patrón visual de `mockups/forgot-password.html`.

## Convenciones aplicadas

- **R1**: 0 inline styles.
- **R2**: `<script>` inline solo importa e invoca `inicializarFormularioLogin`.
- **R3**: `AuthButtons` reusable (usado también en modal de `index.astro` y futuro dashboard).
- **R4**: PascalCase para componente, kebab-case para classes con prefijo `auth-`.