-- migrate:up
CREATE TABLE test.broken (id BIGINT);

-- migrate:down
DROP TABLE test.broken;
SELECT * FROM test.table_that_does_not_exist;
