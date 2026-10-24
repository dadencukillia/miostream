.PHONY: build_images production down dev_env dev_frontend dev_backend dev_shell is_dev_shell test local_test
.SILENT: build_images production down dev_env dev_frontend dev_backend dev_shell is_dev_shell test local_test

USER_SHELL := $(shell echo $$SHELL)

build_images:
	. ./apply_env.sh prod && \
	docker compose build frontend && \
	docker compose build backend

production:
	. ./apply_env.sh prod && \
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
	. ./apply_env.sh test dev && \
	docker compose -f compose.dev.yml up

dev_frontend:
	echo Rerunning is not required to see changes
	echo Port: 4321
	. ./apply_env.sh test dev && \
	cd client && \
	bun dev --host 0.0.0.0 --port 4321

dev_backend:
	echo Rerunning is required to see changes
	echo Port: 8080
	. ./apply_env.sh test dev && \
	cd server && \
	POSTGRES_HOST=localhost:5432 REDIS_HOST=localhost:6379 RUSTFS_HOST=localhost:9000 \
	bun serve

dev_shell:
	. ./apply_env.sh test dev && \
	echo "Welcome into MioStream dev shell" && \
	${USER_SHELL}

test:
	echo --- PREBUILD ---
	docker compose -f compose.test.yml build frontend
	docker compose -f compose.test.yml build backend
	echo --- PREPULL ---
	docker compose -f compose.test.yml --profile frontend --profile backend pull
	sh -c '\
		set -e; \
		trap "echo --- CLEANUP ---; docker compose -f compose.test.yml down -v" EXIT; \
		. ./apply_env.sh test && \
		echo --- FRONTEND ---; \
		docker compose --profile frontend -f compose.test.yml up --abort-on-container-exit --exit-code-from frontend; \
		echo --- BACKEND ---; \
		docker compose --profile backend -f compose.test.yml up --abort-on-container-exit --exit-code-from backend; \
	'

local_test:
	echo --- FRONTEND ---
	cd client && bun test
	echo --- BACKEND ---
	. ./apply_env.sh test && \
	cd server && \
	POSTGRES_HOST=localhost:5432 REDIS_HOST=localhost:6379 RUSTFS_HOST=localhost:9000 \
	bun test
