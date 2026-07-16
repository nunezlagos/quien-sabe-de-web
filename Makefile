.PHONY: up down build logs ps restart status info help

# Producción: usa /opt/quien-sabe/docker-compose.prod.yml (sin Caddy — vía domain-caddy)
COMPOSE := docker compose -f docker-compose.prod.yml --env-file .env

up:
	$(COMPOSE) up -d --build
	@echo ""
	@echo "🚀 Stack levantado:"
	@echo "   https://quiensabe.cl (vía domain-caddy)"
	@echo "   Logs:   make logs"
	@echo ""

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build --no-cache

logs:
	$(COMPOSE) logs -f

logs-app:
	docker logs -f qs-app

ps:
	$(COMPOSE) ps

status: ps

restart:
	$(COMPOSE) restart

info:
	@echo "=== Containers ==="
	@$(COMPOSE) ps
	@echo
	@echo "=== Healthchecks ==="
	@for c in qs-mysql qs-minio qs-app; do \
	  echo -n "$$c: "; \
	  docker inspect --format '{{.State.Health.Status}}' $$c 2>/dev/null || echo "N/A"; \
	done

help:
	@echo "Comandos:"
	@echo "  make up        - Levantar stack (build + start)"
	@echo "  make down      - Bajar stack"
	@echo "  make build     - Rebuild forzado (sin cache)"
	@echo "  make logs      - Logs de todos los servicios"
	@echo "  make logs-app  - Logs solo del app"
	@echo "  make ps        - Estado de containers"
	@echo "  make restart   - Reiniciar todos los servicios"
	@echo "  make info      - Estado + healthchecks"