import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const addHTTPOutboxQuery = `-- name: AddHTTPOutbox :one
INSERT INTO outbox.http_outbox(url, method, content_type, body, outbox_group)
VALUES($1, $2, $3, $4, $5)
RETURNING outbox_id, url, method, content_type, body, attempts, next_attempt_at, created_at, outbox_group`;

export interface AddHTTPOutboxArgs {
    url: string;
    method: string;
    contentType: string | null;
    body: Buffer | null;
    outboxGroup: string | null;
}

export interface AddHTTPOutboxRow {
    outboxId: string;
    url: string;
    method: string;
    contentType: string | null;
    body: Buffer | null;
    attempts: number;
    nextAttemptAt: Date;
    createdAt: Date;
    outboxGroup: string | null;
}

export async function addHTTPOutbox(client: Client, args: AddHTTPOutboxArgs): Promise<AddHTTPOutboxRow | null> {
    const result = await client.query({
        text: addHTTPOutboxQuery,
        values: [args.url, args.method, args.contentType, args.body, args.outboxGroup],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        outboxId: row[0],
        url: row[1],
        method: row[2],
        contentType: row[3],
        body: row[4],
        attempts: row[5],
        nextAttemptAt: row[6],
        createdAt: row[7],
        outboxGroup: row[8]
    };
}

export const getHTTPOutboxListQuery = `-- name: GetHTTPOutboxList :many
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
    SELECT outbox_id, next_attempt_at FROM due_grouped
    UNION ALL
    SELECT outbox_id, next_attempt_at FROM due_ungrouped
  ) all_due
  ORDER BY next_attempt_at ASC, outbox_id ASC
  LIMIT 50
)
SELECT o.outbox_id, o.url, o.method, o.content_type, o.body, o.attempts, o.next_attempt_at, o.created_at, o.outbox_group
FROM outbox.http_outbox o
JOIN candidates c ON c.outbox_id = o.outbox_id
ORDER BY o.outbox_id ASC
FOR UPDATE OF o SKIP LOCKED`;

export interface GetHTTPOutboxListRow {
    outboxId: string;
    url: string;
    method: string;
    contentType: string | null;
    body: Buffer | null;
    attempts: number;
    nextAttemptAt: Date;
    createdAt: Date;
    outboxGroup: string | null;
}

export async function getHTTPOutboxList(client: Client): Promise<GetHTTPOutboxListRow[]> {
    const result = await client.query({
        text: getHTTPOutboxListQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            outboxId: row[0],
            url: row[1],
            method: row[2],
            contentType: row[3],
            body: row[4],
            attempts: row[5],
            nextAttemptAt: row[6],
            createdAt: row[7],
            outboxGroup: row[8]
        };
    });
}

export const deleteHTTPOutboxQuery = `-- name: DeleteHTTPOutbox :one
DELETE FROM outbox.http_outbox
WHERE outbox_id = $1::BIGINT
RETURNING outbox_id, url, method, content_type, body, attempts, next_attempt_at, created_at, outbox_group`;

export interface DeleteHTTPOutboxArgs {
    outboxId: string;
}

export interface DeleteHTTPOutboxRow {
    outboxId: string;
    url: string;
    method: string;
    contentType: string | null;
    body: Buffer | null;
    attempts: number;
    nextAttemptAt: Date;
    createdAt: Date;
    outboxGroup: string | null;
}

export async function deleteHTTPOutbox(client: Client, args: DeleteHTTPOutboxArgs): Promise<DeleteHTTPOutboxRow | null> {
    const result = await client.query({
        text: deleteHTTPOutboxQuery,
        values: [args.outboxId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        outboxId: row[0],
        url: row[1],
        method: row[2],
        contentType: row[3],
        body: row[4],
        attempts: row[5],
        nextAttemptAt: row[6],
        createdAt: row[7],
        outboxGroup: row[8]
    };
}

export const failedHTTPOutboxQuery = `-- name: FailedHTTPOutbox :one
UPDATE outbox.http_outbox
SET
  attempts = attempts + 1,
  next_attempt_at = now() + ($1::integer || ' milliseconds')::interval
WHERE outbox_id = $2::BIGINT
RETURNING outbox_id, url, method, content_type, body, attempts, next_attempt_at, created_at, outbox_group`;

export interface FailedHTTPOutboxArgs {
    nextTryMs: number;
    outboxId: string;
}

export interface FailedHTTPOutboxRow {
    outboxId: string;
    url: string;
    method: string;
    contentType: string | null;
    body: Buffer | null;
    attempts: number;
    nextAttemptAt: Date;
    createdAt: Date;
    outboxGroup: string | null;
}

export async function failedHTTPOutbox(client: Client, args: FailedHTTPOutboxArgs): Promise<FailedHTTPOutboxRow | null> {
    const result = await client.query({
        text: failedHTTPOutboxQuery,
        values: [args.nextTryMs, args.outboxId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        outboxId: row[0],
        url: row[1],
        method: row[2],
        contentType: row[3],
        body: row[4],
        attempts: row[5],
        nextAttemptAt: row[6],
        createdAt: row[7],
        outboxGroup: row[8]
    };
}

export const clearFailedHTTPOutboxQuery = `-- name: ClearFailedHTTPOutbox :exec
DELETE FROM outbox.http_outbox
WHERE attempts > $1::integer`;

export interface ClearFailedHTTPOutboxArgs {
    minAttempts: number;
}

export async function clearFailedHTTPOutbox(client: Client, args: ClearFailedHTTPOutboxArgs): Promise<void> {
    await client.query({
        text: clearFailedHTTPOutboxQuery,
        values: [args.minAttempts],
        rowMode: "array"
    });
}

