import { deleteHTTPOutbox, failedHTTPOutbox, getHTTPOutboxList, GetHTTPOutboxListRow } from "@sqlc/http_outbox_sql";
import * as config from "@config";
import { Pool } from "pg"

interface Logger {
  info(msg: string): void,
  warn(msg: string): void,
  error(msg: string): void,
}

function dispatchHttpOuboxUnit(unit: GetHTTPOutboxListRow) {
  const url = new URL(unit.url);
  let authorizationToken = "";
  const hasBody = unit.method !== "GET" && unit.method !== "HEAD" && unit.body != null;

  switch (url.host) {
  case config.MEILI_HOST:
    authorizationToken = `Bearer ${config.MEILI_MASTER_KEY}`
  }

  const headers: Record<string, string> = {};
  if (unit.contentType) {
    headers["Content-Type"] = unit.contentType;
  }
  if (authorizationToken) {
    headers["Authorization"] = authorizationToken;
  }

  return fetch(url, {
    method: unit.method,
    headers: headers,
    body: hasBody ? unit.body : undefined
  })
}

export const workerTick = <LOGGER extends Logger>(pg: Pool, log: LOGGER) => async () => {
  if (pg.ending || pg.ended) return;

  try {
    const con = await pg.connect();

    try {
      await con.query("BEGIN;");

      const list = await getHTTPOutboxList(con);

      const results = await Promise.all(
        list.map(e => dispatchHttpOuboxUnit(e)
          .then(r => r.ok)
          .catch((e) => {
            log.error(e);
            return false;
          })
        )
      );

      for (let resultIndex = 0; resultIndex < list.length; resultIndex++) {
        const unit = list[resultIndex];
        const result = results[resultIndex];
        if (!unit || result === undefined) continue;

        try {
          if (result) {
            await deleteHTTPOutbox(con, { outboxId: unit.outboxId });
          } else if (unit.attempts > 100) {
            await deleteHTTPOutbox(con, { outboxId: unit.outboxId });
            log.warn(`removed outbox ${ unit.outboxId } due to tries exceed`);
          } else {
            await failedHTTPOutbox(con, {
              outboxId: unit.outboxId,
              nextTryMs: Math.floor(30_000)
            });
          }
        } catch(e) {
          log.error(String(e));
        }
      }

      await con.query("COMMIT;");
    } catch(e) {
      await con.query("ROLLBACK;").catch(_ => {});
      throw e;
    } finally {
      con.release();
    }
  } catch(e) {
    log.error(String(e));
  }
};

export const runHttpOutboxCron = <LOGGER extends Logger>(pg: Pool, log: LOGGER, intervalMs: number) => {
  const interval = setInterval(async () => {
    if (pg.ending || pg.ended) {
      clearInterval(interval);
      return;
    }

    await workerTick(pg, log)();
  }, intervalMs)
}
