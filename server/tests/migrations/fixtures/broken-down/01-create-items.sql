-- migrate:up
CREATE TABLE test.items (id BIGINT PRIMARY KEY);

-- migrate:down
DROP TABLE test.table_that_does_not_exist;
