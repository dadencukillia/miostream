-- migrate:up
CREATE TABLE test.broken (id BIGINT);
SELECT * FROM test.table_that_does_not_exist;

-- migrate:down
DROP TABLE test.broken;
