.PHONY: build_images production down dev_env dev_frontend dev_backend test local_test
.SILENT: build_images production down dev_env dev_frontend dev_backend test local_test

-include .env.sample
-include .env
export

build_images:
	docker compose build frontend
	docker compose build backend

production:
	docker compose up -d

down:
	docker compose -f compose.yml down
	docker compose -f compose.test.yml down
	docker compose -f compose.dev.yml down

dev_env:
	echo PostgreSQL: 5432
	echo Redis: 6379
	echo RustFS API: 9000
	echo RustFS Dashboard: 9001
	docker compose -f compose.dev.yml up

dev_frontend:
	echo Rerunning is not required to see changes
	echo Port: 4321
	cd client && \
	bun dev --host 0.0.0.0 --port 4321

dev_backend:
	echo Rerunning is required to see changes
	echo Port: 8080
	cd server && \
	POSTGRES_HOST=localhost:5432 REDIS_HOST=localhost:6379 RUSTFS_HOST=localhost:9000 \
	bun serve

test:
	echo --- PREBUILD ---
	docker compose -f compose.test.yml build frontend
	docker compose -f compose.test.yml build backend
	echo --- PREPULL ---
	docker compose -f compose.test.yml --profile frontend --profile backend pull
	sh -c '\
		set -e; \
		trap "echo --- CLEANUP ---; docker compose -f compose.test.yml down -v" EXIT; \
		echo --- FRONTEND ---; \
		docker compose --profile frontend -f compose.test.yml up --abort-on-container-exit --exit-code-from frontend; \
		echo --- BACKEND ---; \
		docker compose --env-file ./.env.sample --profile backend -f compose.test.yml up --abort-on-container-exit --exit-code-from backend; \
	'

local_test:
	echo --- FRONTEND ---
	cd client && bun test
	echo --- BACKEND ---
	set -a && . ./.env.sample && set +a && \
	cd server && \
	POSTGRES_HOST=localhost:5432 REDIS_HOST=localhost:6379 RUSTFS_HOST=localhost:9000 \
	bun test
