-- migrate:up
ALTER TABLE test.posts ADD COLUMN published_at TIMESTAMPTZ;

-- migrate:down
ALTER TABLE test.posts DROP COLUMN published_at;
