# HU-01.8 — Design: Vista standalone `/iniciar-sesion`

## Estructura de archivos

```
src/
├── components/
│   └── auth/
│       └── AuthButtons.astro          ← NUEVO, reusable
├── lib/
│   └── client/
│       ├── auth/
│       │   └── login.ts               ← NUEVO, lógica del form
│       └── ui/
│           └── toast.ts               ← NUEVO, helper de notificaciones
├── pages/
│   └── iniciar-sesion.astro           ← REFACTOR, cumple R1/R2/R3
└── styles/
    ├── components.css                 ← EXTENDER, agregar .auth-buttons y .btn
    └── pages/
        └── login.css                  ← NUEVO, estilos específicos de la vista

mockups/
└── login.html                         ← NUEVO, mockup de referencia
```

## Estilos (R1)

```css
/* src/styles/pages/login.css */
.auth-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: var(--space-8) var(--space-4);
  background: var(--color-bg-light);
}

.auth-page__back {
  align-self: flex-start;
  margin-bottom: var(--space-4);
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--text-sm);
}

.auth-card {
  background: var(--color-bg);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-8);
  width: 100%;
  max-width: 28rem;
}

.auth-form { display: flex; flex-direction: column; gap: var(--space-4); }
.auth-form__label { font-size: var(--text-sm); font-weight: 700; }
.auth-form__input { /* ver components.css */ }

.auth-card__divider {
  display: flex;
  align-items: center;
  margin: var(--space-6) 0;
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
}
.auth-card__divider::before,
.auth-card__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}
.auth-card__divider span { padding: 0 var(--space-3); }
```

## Lógica de cliente (R2)

```ts
// src/lib/client/auth/login.ts
import { mostrarToast } from '../ui/toast';

export function mostrarProximamente(provider: string): void {
  mostrarToast(`Próximamente — ${provider} no disponible en demo`, 'info');
}

export function inicializarFormularioLogin(): void {
  const form = document.getElementById('form-login') as HTMLFormElement | null;
  const errores = document.getElementById('errores-campos');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errores) {
      errores.classList.add('auth-card__alert--hidden');
      errores.innerHTML = '';
    }
    const fd = new FormData(form);
    const cuerpo = {
      correo: String(fd.get('correo') ?? '').toLowerCase().trim(),
      contrasena: String(fd.get('contrasena') ?? ''),
    };
    const resp = await fetch('/api/v1/auth/iniciar-sesion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    if (resp.ok) {
      const redirigir = form.dataset.redirigir || '/dashboard';
      window.location.href = redirigir;
      return;
    }
    const mensajes = await mapearErroresLogin(resp);
    if (errores) {
      errores.classList.remove('auth-card__alert--hidden');
      errores.innerHTML = mensajes.map(m => `<div>• ${m}</div>`).join('');
    }
  });
}

async function mapearErroresLogin(resp: Response): Promise<string[]> {
  if (resp.status === 401) return ['Credenciales inválidas. Revisa tu correo y contraseña.'];
  if (resp.status === 403) return ['Tu cuenta está deshabilitada. Contacta a soporte.'];
  const data = await resp.json().catch(() => ({}));
  return [data.error || 'No se pudo iniciar sesión. Intenta de nuevo.'];
}
```

```ts
// src/lib/client/ui/toast.ts
type TipoToast = 'info' | 'success' | 'error';

export function mostrarToast(mensaje: string, tipo: TipoToast = 'info'): void {
  // Implementación con DOM injection (no inline)
  const cont = document.getElementById('toast-container') ?? crearContenedor();
  const t = document.createElement('div');
  t.className = `toast toast--${tipo}`;
  t.textContent = mensaje;
  cont.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function crearContenedor(): HTMLElement {
  const c = document.createElement('div');
  c.id = 'toast-container';
  c.className = 'toast-container';
  document.body.appendChild(c);
  return c;
}
```

## Mockup `mockups/login.html`

Mockup estático HTML+CSS, sin `<script>`, reutilizando el patrón visual
de `mockups/forgot-password.html`. Estructura:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Iniciar sesión — Quién Sabe</title>
  <!-- Tailwind, Remix Icon, Google Fonts igual que forgot-password.html -->
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg-bg-light min-h-screen flex flex-col items-center justify-center p-4 font-sans">
  <a href="index.html" class="self-start mb-4 text-sm text-gray-500 hover:text-gray-700">← Volver al inicio</a>
  <article class="bg-white rounded-2xl shadow-md p-8 max-w-md w-full">
    <h1 class="text-3xl font-extrabold text-gray-800 mb-2">Inicia sesión</h1>
    <p class="text-gray-600 mb-6">Vuelve a conectar con tus vecinos.</p>

    <!-- Form email + password -->
    <form class="space-y-4">
      <div>
        <label class="block text-sm font-bold text-gray-700 mb-1">Correo</label>
        <input type="email" required class="w-full p-3 rounded-xl border border-gray-200">
      </div>
      <div>
        <label class="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
        <input type="password" required class="w-full p-3 rounded-xl border border-gray-200">
      </div>
      <button class="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold">
        Iniciar sesión
      </button>
    </form>

    <div class="relative py-4 my-4 flex items-center">
      <div class="flex-1 border-t border-gray-200"></div>
      <span class="px-3 text-xs uppercase text-gray-400">O continúa con</span>
      <div class="flex-1 border-t border-gray-200"></div>
    </div>

    <!-- AuthButtons visual-only -->
    <div class="space-y-3">
      <button class="w-full flex items-center justify-center gap-3 border border-gray-300 py-3.5 rounded-xl text-gray-700 cursor-not-allowed opacity-60" aria-disabled="true" title="Próximamente">
        <i class="ri-google-fill text-red-500"></i> Continuar con Google
      </button>
      <button class="w-full flex items-center justify-center gap-3 bg-[#1877F2]/60 text-white py-3.5 rounded-xl cursor-not-allowed opacity-60" aria-disabled="true" title="Próximamente">
        <i class="ri-facebook-fill"></i> Continuar con Facebook
      </button>
      <a href="dashboard-admin.html" class="w-full flex items-center justify-center gap-3 bg-gray-800 text-white py-3.5 rounded-xl font-bold shadow-md">
        <i class="ri-dashboard-3-line"></i> Acceso Corporativo / Admin
      </a>
    </div>

    <p class="text-center text-xs text-gray-400 mt-6">
      Al iniciar sesión aceptas nuestras <a href="terms.html" class="underline hover:text-primary">normas de convivencia</a>.
    </p>
    <p class="text-center text-sm text-gray-600 mt-4">
      ¿No tienes cuenta? <a href="register.html" class="text-orange-500 font-bold hover:underline">Crea una</a>
    </p>
  </article>
</body>
</html>
```

## Tests

### Unit (`tests/unit/client/auth/login.test.ts`)

Mockear `fetch` y `window.location`. Verificar:
- `mostrarProximamente('google')` agrega elemento al DOM
- Submit con credenciales válidas → redirect a `redirigir` o `/dashboard`
- Submit con 401 → muestra mensaje "Credenciales inválidas"
- Submit con 403 → muestra mensaje "cuenta deshabilitada"

### Integración (ya cubierto por HU-01.1)

### E2E (`tests/e2e/auth-login-standalone.spec.ts`)

- Carga `/iniciar-sesion` → ve el form completo
- Click "Continuar con Google" → ve toast, NO redirige
- Click "Acceso Corporativo" → redirige a `/dashboard`
- Submit con `vecino@demo.cl` / `Demo1234` → redirige a `/dashboard`
- Submit con credenciales malas → ve mensaje inline
- Visitar `?redirigir=/p/juan` + submit válido → redirige a `/p/juan`
- Usuario con sesión activa visita `/iniciar-sesion` → redirige a `/dashboard`

## Convenciones aplicadas

- R1 ✓ (cero `style="..."`)
- R2 ✓ (`<script>` inline solo importa)
- R3 ✓ (`AuthButtons` reusable)
- R4 ✓ (PascalCase + kebab-case con prefijo)