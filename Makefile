.PHONY: build_images production devenv devfrontend devbackend test local_test
.SILENT: build_images production devenv devfrontend devbackend test local_test

build_images:
	docker-compose build frontend
	docker-compose build backend

production:
	docker-compose up -d

devenv:
	echo PostgreSQL: 5432
	echo Redis: 6379
	echo RustFS API: 9000
	echo RustFS Dashboard: 9001
	docker-compose -f compose.dev.yml up

devfrontend:
	echo Rerunning is not required to see changes
	echo Port: 4321
	cd client && \
	bun dev --host 0.0.0.0 --port 4321

devbackend:
	echo Rerunning is required to see changes
	echo Port: 8080
	cd server && \
	bun serve

test:
	echo --- PREBUILD ---
	docker-compose -f compose.test.yml build frontend
	docker-compose -f compose.test.yml build backend
	export SUCCESS_TEST=false; \
	echo --- FRONTEND ---; \
	docker-compose --profile frontend -f compose.test.yml up --abort-on-container-exit --exit-code-from frontend && \
	echo --- BACKEND --- && \
	docker-compose --profile backend -f compose.test.yml up --abort-on-container-exit --exit-code-from backend && \
	export SUCCESS_TEST=true; \
	echo --- SUCCESS: $$SUCCESS_TEST ---; \
	"$$SUCCESS_TEST" == "true"

local_test:
	export SUCCESS_TEST=false; \
	echo --- FRONTEND ---; \
	cd client && bun test && \
	echo --- BACKEND --- && \
	cd ../server && bun test && \
	export SUCCESS_TEST=true; \
	echo --- SUCCESS: $$SUCCESS_TEST ---; \
	"$$SUCCESS_TEST" == "true"
