up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

rebuild:
	docker compose down && docker compose up -d --build

seed:
	docker compose exec db psql -U justus -d justus_vote -f /docker-entrypoint-initdb.d/schema.sql
