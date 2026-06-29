# HU-01.9 — Design: Vista `/registro` informativa

## Estructura de archivos

```
src/
├── pages/
│   ├── registro.astro                 ← REFACTOR, vista informativa
│   └── api/v1/auth/
│       └── registro.ts                ← MODIFICAR, responder 410
└── styles/
    └── pages/
        └── login.css                  ← REUSAR estilos de /iniciar-sesion

mockups/
└── register.html                      ← NUEVO, mockup
```

## Mockup `mockups/register.html`

Mockup estático HTML+CSS, sin `<script>`. Estructura:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Registro cerrado — Quién Sabe</title>
  <!-- Mismos CDN que login.html -->
</head>
<body class="bg-bg-light min-h-screen flex flex-col items-center justify-center p-4 font-sans">
  <a href="index.html" class="self-start mb-4 text-sm text-gray-500">← Volver al inicio</a>

  <article class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full text-center">
    <!-- Icono puerta cerrada -->
    <div class="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-200">
      <i class="ri-lock-2-line text-3xl text-gray-500"></i>
    </div>

    <h1 class="text-2xl font-extrabold text-gray-800 mb-2">El registro está cerrado durante la demo</h1>
    <p class="text-gray-500 mb-6 text-sm">
      Estamos en una fase de prueba con usuarios pre-seleccionados. Pronto abriremos el registro público.
    </p>

    <!-- Lista de opciones -->
    <ul class="text-left space-y-3 mb-6">
      <li class="flex gap-3 text-sm">
        <i class="ri-user-smile-line text-primary text-xl flex-shrink-0 mt-0.5"></i>
        <span><b>Usa uno de los usuarios demo</b>: <code class="bg-gray-100 px-1 rounded">vecino@demo.cl</code>, <code class="bg-gray-100 px-1 rounded">prestador@demo.cl</code> o <code class="bg-gray-100 px-1 rounded">admin@demo.cl</code> (contraseña: <code class="bg-gray-100 px-1 rounded">Demo1234</code>).</span>
      </li>
      <li class="flex gap-3 text-sm">
        <i class="ri-login-box-line text-primary text-xl flex-shrink-0 mt-0.5"></i>
        <span>Inicia sesión desde <a href="login.html" class="text-primary font-bold underline">Iniciar sesión</a>.</span>
      </li>
      <li class="flex gap-3 text-sm">
        <i class="ri-mail-send-line text-primary text-xl flex-shrink-0 mt-0.5"></i>
        <span>Solicita acceso anticipado: <a href="mailto:earlyaccess@quiensabe.cl" class="text-primary font-bold underline">earlyaccess@quiensabe.cl</a></span>
      </li>
    </ul>

    <!-- CTA principal -->
    <a href="login.html" class="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition">
      Iniciar sesión con un usuario demo
    </a>

    <p class="text-center text-sm text-gray-600 mt-6">
      ¿Ya tienes cuenta? <a href="login.html" class="text-primary font-bold underline">Inicia sesión</a>.
    </p>
  </article>
</body>
</html>
```

## Vista refactorizada

Reusar los estilos de `src/styles/pages/login.css` (mismas clases `.auth-page`, `.auth-card`, etc.).

## Tests

### Unit (mínimos)

- `tests/unit/pages/registro-redirect.test.ts` — verificar que cuando `Astro.locals.user` existe, se llama `Astro.redirect`.

### Integración

- `tests/integration/auth/registro-410.test.ts`:
  - `POST /api/v1/auth/registro` con body válido → status 410
  - `POST /api/v1/auth/registro` con body inválido → status 410
  - Response body contiene `error: "registro deshabilitado en esta fase"`

### E2E

- `tests/e2e/auth-registro-closed.spec.ts`:
  - GET `/registro` → ve el mensaje, NO ve form con inputs
  - GET `/registro` con sesión activa → redirige a `/dashboard`
  - Click en CTA → redirige a `/iniciar-sesion`

## Convenciones aplicadas

- R1 ✓ (cero `style="..."`)
- R2 ✓ (cero `<script>` — vista 100% declarativa)
- R3 ✓ (no requiere componentes nuevos; reusa estilos de `.auth-card`)
- R4 ✓ (mismas clases que `/iniciar-sesion` para consistencia visual)