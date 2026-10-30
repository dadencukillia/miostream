-- migrate:up
CREATE TABLE test.posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES test.users(id),
  body TEXT NOT NULL
);

-- migrate:down
DROP TABLE test.posts;
