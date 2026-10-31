import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import Fastify from "fastify";
import api from "../../src/api/plugin";

const id = "018f23ab-1234-7123-8123-123456789abc";
const row = [id, "sample-anime", "Назва", "Title", "Original", "Description", "cover", "Studio", "123", null, null, null, 2020, 24, 12, "pg13", "ongoing", "tv", true, ["action"]];
let databaseError: unknown;
const calls: string[] = [];
const db = {
  async query(input: string | { text: string }) {
    const name = typeof input === "string" ? input : /^-- name: (\w+)/.exec(input.text)?.[1] ?? "";
    calls.push(name);
    if (databaseError) throw databaseError;
    if (name === "CountAnimes") return { rows: [[1]] };
    if (name === "ListAnimes" || name === "GetAnimeById" || name === "GetAnimeBySlug") return { rows: [row] };
    if (name === "CreateAnime") return { rows: [[id]] };
    if (name === "CountAnimesByStatus") return { rows: [["ongoing", 2]] };
    return { rows: [] };
  },
  async connect() { return { query: db.query, release() {} }; },
};
const app = Fastify();

describe("anime API", () => {
  beforeAll(async () => {
    app.decorate("pg", db);
    app.register(api, { prefix: "/api" });
    await app.ready();
  });
  afterAll(async () => { await app.close(); });

  test("lists anime with defaults and serializes the public response", async () => {
    const response = await app.inject({ method: "GET", url: "/api/anime" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      items: [{ animeId: id, slug: "sample-anime", malId: 123, genres: ["action"] }],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    });
  });

  test("routes ID and slug lookups to the corresponding query", async () => {
    calls.length = 0;
    const byId = await app.inject({ method: "GET", url: `/api/anime/${id}` });
    const bySlug = await app.inject({ method: "GET", url: "/api/anime/slug/sample-anime" });
    expect(byId.statusCode).toBe(200);
    expect(bySlug.statusCode).toBe(200);
    expect(calls).toEqual(["GetAnimeById", "GetAnimeBySlug"]);
  });

  test("creates an anime and returns the public representation", async () => {
    const response = await app.inject({ method: "POST", url: "/api/anime", payload: { slug: "sample-anime", titleEn: "Title" } });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ animeId: id, slug: "sample-anime", titleEn: "Title" });
  });

  test("routes status statistics without treating stats as an anime ID", async () => {
    calls.length = 0;
    const response = await app.inject({ method: "GET", url: "/api/anime/stats/by-status" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([{ animeStatus: "ongoing", total: 2 }]);
    expect(calls).toEqual(["CountAnimesByStatus"]);
  });

  test("rejects invalid path, query, and body data before reaching the database", async () => {
    const requests = [
      { method: "GET" as const, url: "/api/anime/not-a-uuid" },
      { method: "GET" as const, url: "/api/anime/slug/Bad_Slug" },
      { method: "GET" as const, url: "/api/anime?page=0" },
      { method: "GET" as const, url: "/api/anime?limit=101" },
      { method: "GET" as const, url: "/api/anime?format=invalid" },
      { method: "POST" as const, url: "/api/anime", payload: { slug: "valid", titleEn: "Title", genres: ["action", "action"] } },
      { method: "POST" as const, url: "/api/anime", payload: { slug: "valid", titleEn: "Title", yearReleased: 1899 } },
      { method: "PATCH" as const, url: `/api/anime/${id}`, payload: {} },
    ];
    calls.length = 0;
    for (const request of requests) {
      const response = await app.inject(request);
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ ok: false });
    }
    expect(calls).toHaveLength(0);
  });

  test("returns conflict details for known database errors and hides unexpected errors", async () => {
    try {
      databaseError = { code: "23505", constraint: "animes_slug_key" };
      const conflict = await app.inject({ method: "GET", url: `/api/anime/${id}` });
      expect(conflict.statusCode).toBe(409);
      expect(conflict.json()).toEqual({ ok: false, message: "Anime with this slug already exists" });
      databaseError = new Error("sensitive database details");
      const error = await app.inject({ method: "GET", url: `/api/anime/${id}` });
      expect(error.statusCode).toBe(500);
      expect(error.json()).toEqual({ ok: false, message: "Unexpected error" });
    } finally {
      databaseError = undefined;
    }
  });
});
