# AGENTS.md — QuiénSabe de Web

## Code conventions

- **Code in English**: all variable names, function names, class names, file names, DB columns, and comments MUST be in English.
- **User-facing text**: all visible UI text (labels, buttons, messages) MUST be in Spanish (Chile).
- **Endpoints**: URL paths remain in Spanish (e.g. `/iniciar-sesion`, `/verificar-oficio`, `/api/v1/auth/iniciar-sesion`).
- **Database**: table names and column names in English (e.g. `trades`, `users`, `base_price_clp`, `created_at`).

## Stack

Astro 5 + Tailwind 4 + Drizzle ORM + Cloudflare D1/KV/R2. Docker-first dev.

## Architecture

- **All JS/CSS must be in their own files under `src/lib/client/` or `src/styles/`**, never inline in Astro templates. Extract `<script>` and `<style>` blocks to dedicated files and import them.
- **Components** in `src/components/`, **pages** in `src/pages/`, **client JS** in `src/lib/client/`, **validators** in `src/lib/validators/`, **services** in `src/lib/services/`.
