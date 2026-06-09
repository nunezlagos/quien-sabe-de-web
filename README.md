# quien-sabe-de-web

App Astro + Cloudflare (D1, R2, KV) con stack de desarrollo dockerizado (Mailpit + MinIO).

## Setup rápido (Docker)

```bash
# 1. Configurar entorno
cp .env.example .env
cp wrangler.toml.example wrangler.toml

# 2. Levantar el stack (app + mailpit + minio + bucket inicial)
make up

# 3. Aplicar migraciones D1 locales
make migrate
```

## Servicios y puertos

| Servicio       | URL                       | Puerto host |
|----------------|---------------------------|-------------|
| Astro app      | http://localhost:4323     | 4323        |
| Mailpit (UI)   | http://localhost:8026     | 8026        |
| Mailpit (SMTP) | localhost:1028            | 1028        |
| MinIO API      | http://localhost:9002     | 9002        |
| MinIO Console  | http://localhost:9003     | 9003        |

**Credenciales MinIO:** `minioadmin` / `minioadmin` (definidas en `docker-compose.dev.yml`).
**Bucket creado por defecto:** `quien-sabe-files`.

## Comandos Make

| Comando         | Qué hace                                                   |
|-----------------|------------------------------------------------------------|
| `make up`       | Levantar stack completo (build incluido)                   |
| `make down`     | Detener stack                                              |
| `make build`    | Rebuild sin cache                                          |
| `make logs`     | Seguir logs del container `app`                            |
| `make logs-all` | Logs de todos los servicios                                |
| `make shell`    | Entrar al container `app`                                  |
| `make restart`  | Reiniciar solo `app` (mailpit/minio siguen up)             |
| `make migrate`  | Aplicar migraciones Drizzle a D1 local                     |
| `make generate` | Generar migración nueva desde `src/database/schema.ts`     |
| `make studio`   | Abrir Drizzle Studio                                       |
| `make ps`       | Estado de los containers                                   |
| `make clean`    | Bajar stack y borrar volúmenes (D1 local + MinIO data)     |

## Hot reload

El container `app` monta `src/`, `public/`, `astro.config.mjs`, `tsconfig.json` y `drizzle.config.ts` como volumes. Cualquier cambio se refleja automáticamente vía Vite watch (con `CHOKIDAR_USEPOLLING=true` para que el watcher funcione bien dentro de Docker).

## Convenciones

- **Docker-first:** Todo corre en el container. No instalar Bun/Wrangler en el host para este proyecto.
- **Commits:** `/respaldo <slug>` (estilo respaldo, sin Co-Authored-By).
- **SDD + TDD:** ver `.claude/CLAUDE.md` para el flujo completo.
