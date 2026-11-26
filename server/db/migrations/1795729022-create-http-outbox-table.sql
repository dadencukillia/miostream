-- migrate:up
CREATE SCHEMA IF NOT EXISTS outbox;

CREATE TABLE outbox.http_outbox(
  outbox_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url TEXT NOT NULL,
  method TEXT NOT NULL,
  content_type TEXT DEFAULT NULL,
  body BYTEA,

  attempts INT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  outbox_group TEXT -- to make sure the only first in the group will be dispatched
);

CREATE INDEX idx_http_outbox_group_order
  ON outbox.http_outbox(outbox_group, outbox_id)
  WHERE outbox_group IS NOT NULL;

CREATE INDEX idx_http_outbox_due_ungrouped
  ON outbox.http_outbox(next_attempt_at, outbox_id)
  WHERE outbox_group IS NULL;

-- migrate:down
DROP TABLE IF EXISTS outbox.http_outbox;
DROP SCHEMA IF EXISTS outbox;
