import { afterEach, describe, expect, test } from "bun:test";
import Fastify from "fastify";
import api from "@/api/api.plugin";

const userId = "00000000-0000-0000-0000-000000000000"; // Current auth middleware's synthetic identity.
const animeId = "018f23ab-1234-7123-8123-123456789abc";
const base = `/api/list/${animeId}`;
const headers = { authorization: "Bearer test-user" };
const unit = { userId, animeId, watchedEpisodes: 0, repeatTimes: 0, startedWatching: "2026-01-01", listUnitStatus: "watching", grade: null };
const apps: ReturnType<typeof Fastify>[] = [];

function setup(options: { missing?: boolean; error?: unknown } = {}) {
  const calls: { text: string; values: unknown[] }[] = [];
  const app = Fastify();
  app.decorate("pg", {
    async query(input: string | { text: string; values: unknown[] }, values?: unknown[]) {
      calls.push(typeof input === "string" ? { text: input, values: values ?? [] } : input);
      if (options.error) throw options.error;
      return { rows: options.missing ? [] : [Object.values(unit)], rowCount: options.missing ? 0 : 1 };
    },
  });
  app.register(api, { prefix: "/api" });
  apps.push(app);
  return { app, calls };
}

afterEach(async () => { await Promise.all(apps.splice(0).map(app => app.close())); });

describe("list API", () => {
  test("creates through the API plugin using the authenticated user rather than a supplied userId", async () => {
    const { app, calls } = setup();
    const response = await app.inject({ method: "POST", url: "/api/list/", headers, payload: { animeId, userId: "a7b3fd74-00ab-4d5c-949e-07c135475bd1" } });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual(unit);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.values.slice(0, 4)).toEqual([userId, animeId, 0, 0]);
    expect(calls[0]!.values.slice(5)).toEqual(["watching", null]);
  });

  test("updates a list unit and serializes a nullable grade", async () => {
    const { app, calls } = setup();
    const response = await app.inject({ method: "PATCH", url: base, headers, payload: { grade: null, watchedEpisodes: 0 } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(unit);
    expect(calls[0]!.values).toEqual([userId, animeId, 0, null]);
  });

  test("deletes a list unit with an empty 204 response", async () => {
    const { app, calls } = setup();
    const response = await app.inject({ method: "DELETE", url: base, headers });
    expect(response.statusCode).toBe(204);
    expect(response.body).toBe("");
    expect(calls[0]!.values).toEqual([userId, animeId]);
  });

  test.each(["POST", "PATCH", "DELETE"] as const)("denies unauthenticated %s before querying", async (method) => {
    const { app, calls } = setup();
    const response = await app.inject({ method, url: method === "POST" ? "/api/list/" : base, payload: method === "DELETE" ? undefined : method === "POST" ? { animeId } : { grade: 0 } });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ ok: false, message: "no access" });
    expect(calls).toHaveLength(0);
  });

  test.each(["PATCH", "DELETE"] as const)("returns 404 for a missing %s target", async (method) => {
    const { app } = setup({ missing: true });
    const response = await app.inject({ method, url: base, headers, payload: method === "PATCH" ? { grade: 0 } : undefined });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ ok: false, message: "list unit not found" });
  });

  test("returns 409 for duplicate creation", async () => {
    const { app } = setup({ error: { code: "23505" } });
    const response = await app.inject({ method: "POST", url: "/api/list/", headers, payload: { animeId } });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ ok: false, message: "list unit already exists" });
  });

  test("returns a safe 400 for invalid database creation data", async () => {
    const { app } = setup({ error: { code: "23503", detail: "private details" } });
    const response = await app.inject({ method: "POST", url: "/api/list/", headers, payload: { animeId } });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ ok: false, message: "invalid list unit data" });
  });

  test.each(["PATCH", "DELETE"] as const)("hides unexpected %s database errors", async (method) => {
    const { app } = setup({ error: new Error("private database details") });
    const response = await app.inject({ method, url: base, headers, payload: method === "PATCH" ? { grade: 0 } : undefined });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ ok: false, message: "unknown error" });
  });

  test("rejects an empty update without querying", async () => {
    const { app, calls } = setup();
    const response = await app.inject({ method: "PATCH", url: base, headers, payload: {} });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ ok: false, message: "invalid list unit data" });
    expect(calls).toHaveLength(0);
  });

  test.each([-5, 0, 5, null])("accepts grade boundary %#", async (grade) => {
    const { app, calls } = setup();
    const response = await app.inject({ method: "PATCH", url: base, headers, payload: { grade } });
    expect(response.statusCode).toBe(200);
    expect(calls[0]!.values).toEqual([userId, animeId, grade]);
  });

  test.each([
    {}, { animeId: "invalid" }, { animeId, watchedEpisodes: -1 }, { animeId, repeatTimes: -1 },
    { animeId, watchedEpisodes: 1.5 }, { animeId, repeatTimes: 1.5 },
    { animeId, grade: -6 }, { animeId, grade: 6 }, { animeId, grade: 0.5 },
    { animeId, listUnitStatus: "unknown" }, { animeId, startedWatching: "not-a-date" },
  ])("rejects invalid create payload %# before querying", async (payload) => {
    const { app, calls } = setup();
    const response = await app.inject({ method: "POST", url: "/api/list/", headers, payload });
    expect(calls).toHaveLength(0);
    expect(response.statusCode).toBe(400);
    expect(response.json().ok).toBe(false);
  });

  test.each([
    { watchedEpisodes: -1 }, { repeatTimes: -1 }, { watchedEpisodes: 1.5 }, { repeatTimes: 1.5 },
    { grade: -6 }, { grade: 6 }, { grade: 0.5 }, { listUnitStatus: "unknown" }, { startedWatching: "not-a-date" },
  ])("rejects invalid update payload %# before querying", async (payload) => {
    const { app, calls } = setup();
    const response = await app.inject({ method: "PATCH", url: base, headers, payload });
    expect(calls).toHaveLength(0);
    expect(response.statusCode).toBe(400);
    expect(response.json().ok).toBe(false);
  });

  test.each(["PATCH", "DELETE"] as const)("rejects malformed anime IDs on %s before querying", async (method) => {
    const { app, calls } = setup();
    const response = await app.inject({ method, url: "/api/list/not-a-uuid", headers, payload: method === "PATCH" ? { grade: 0 } : undefined });
    expect(calls).toHaveLength(0);
    expect(response.statusCode).toBe(400);
    expect(response.json().ok).toBe(false);
  });
});
