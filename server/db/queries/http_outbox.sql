-- name: AddHTTPOutbox :one
INSERT INTO outbox.http_outbox(url, method, content_type, body, outbox_group)
VALUES($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetHTTPOutboxList :many
WITH head_per_group AS (
  SELECT DISTINCT ON(outbox_group)
    outbox_id,
    outbox_group,
    next_attempt_at
  FROM outbox.http_outbox
  WHERE outbox_group IS NOT NULL
  ORDER BY outbox_group, outbox_id ASC
),
due_grouped AS (
  SELECT outbox_id, next_attempt_at
  FROM head_per_group
  WHERE next_attempt_at <= now()
  ORDER BY next_attempt_at ASC, outbox_id ASC
  LIMIT 50
),
due_ungrouped AS (
  SELECT outbox_id, next_attempt_at
  FROM outbox.http_outbox
  WHERE outbox_group IS NULL
    AND next_attempt_at <= now()
  ORDER BY next_attempt_at ASC, outbox_id ASC
  LIMIT 50
),
candidates AS (
  SELECT outbox_id, next_attempt_at
  FROM (
    SELECT * FROM due_grouped
    UNION ALL
    SELECT * FROM due_ungrouped
  ) all_due
  ORDER BY next_attempt_at ASC, outbox_id ASC
  LIMIT 50
)
SELECT o.*
FROM outbox.http_outbox o
JOIN candidates c ON c.outbox_id = o.outbox_id
ORDER BY o.outbox_id ASC
FOR UPDATE OF o SKIP LOCKED;

-- name: DeleteHTTPOutbox :one
DELETE FROM outbox.http_outbox
WHERE outbox_id = @outbox_id::BIGINT
RETURNING *;

-- name: FailedHTTPOutbox :one
UPDATE outbox.http_outbox
SET
  attempts = attempts + 1,
  next_attempt_at = now() + (@next_try_ms::integer || ' milliseconds')::interval
WHERE outbox_id = @outbox_id::BIGINT
RETURNING *;

-- name: ClearFailedHTTPOutbox :exec
DELETE FROM outbox.http_outbox
WHERE attempts > @min_attempts::integer;
