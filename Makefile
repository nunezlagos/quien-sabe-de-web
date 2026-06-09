.PHONY: up down build logs shell restart migrate generate studio status ps clean

# Stack dev completo (Astro + Mailpit + MinIO)
up:
	docker compose -f docker-compose.dev.yml up -d --build
	@echo ""
	@echo "🚀 Stack levantado:"
	@echo "   App:           http://localhost:4323"
	@echo "   Mailpit UI:    http://localhost:8026"
	@echo "   MinIO Console: http://localhost:9003 (user: minioadmin / pass: minioadmin)"
	@echo ""

down:
	docker compose -f docker-compose.dev.yml down

build:
	docker compose -f docker-compose.dev.yml build --no-cache

logs:
	docker logs -f quien-sabe-app

logs-all:
	docker compose -f docker-compose.dev.yml logs -f

shell:
	docker exec -it quien-sabe-app sh

restart:
	docker compose -f docker-compose.dev.yml restart app

# Drizzle / D1
migrate:
	docker exec quien-sabe-app bun run db:migrate:local

generate:
	docker exec quien-sabe-app bun run db:generate

studio:
	docker exec -it quien-sabe-app bun run db:studio

# Estado del stack
status: ps
ps:
	docker compose -f docker-compose.dev.yml ps

# Limpieza profunda (borra volumenes — D1 local, MinIO, node_modules del container)
clean:
	docker compose -f docker-compose.dev.yml down -v

help:
	@echo "Comandos disponibles:"
	@echo "  make up        - Levantar stack dev (app + mailpit + minio)"
	@echo "  make down      - Detener stack"
	@echo "  make build     - Rebuild forzado (sin cache)"
	@echo "  make logs      - Seguir logs del container app"
	@echo "  make logs-all  - Seguir logs de todos los servicios"
	@echo "  make shell     - Entrar al container app"
	@echo "  make restart   - Reiniciar solo el container app"
	@echo "  make migrate   - Aplicar migraciones drizzle a D1 local"
	@echo "  make generate  - Generar migración nueva desde schema.ts"
	@echo "  make studio    - Abrir Drizzle Studio"
	@echo "  make ps        - Estado de los containers"
	@echo "  make clean     - Bajar stack y borrar volúmenes (D1 local + MinIO data)"
