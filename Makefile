.PHONY: test local_test
.SILENT: test local_test

test:
	export SUCCESS_TEST=false; \
	echo --- FRONTEND ---; \
	docker-compose --profile frontend -f compose.test.yml up --build --abort-on-container-exit --exit-code-from frontend && \
	echo --- BACKEND --- && \
	docker-compose --profile backend -f compose.test.yml up --build --abort-on-container-exit --exit-code-from backend && \
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
