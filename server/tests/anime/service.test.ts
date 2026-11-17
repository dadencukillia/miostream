import { describe, expect, test } from "bun:test";
import type { Pool } from "pg";
import * as service from "@/api/anime/anime.service";
import { toAnimeModel } from "@/api/anime/anime.model";
import { AnimeErrors } from "@/api/anime/anime.errors";

const id = "018f23ab-1234-7123-8123-123456789abc";
const row = [id, "sample-anime", "Назва", "Title", "Original", "Description", "cover", "Studio", "123", "456", "hikka", "tt123", 2020, 24, 12, "pg13", "ongoing", "tv", true, ["action", "drama"]];

type Call = { name: string; text: string; values: unknown[] };

// Exercise the generated query adapters as well as the service without a database.
function fakeDb(options: { missing?: boolean; failAt?: string; error?: unknown; total?: number } = {}) {
  const calls: Call[] = [];
  let released = false;
  let genres = ["action", "drama"];
  let exists = !options.missing;
  const query = async (input: string | { text: string; values: unknown[] }) => {
    const text = typeof input === "string" ? input : input.text;
    const name = /^-- name: (\w+)/.exec(text)?.[1] ?? text;
    calls.push({ name, text, values: typeof input === "string" ? [] : input.values });
    if (name === options.failAt) throw options.error;
    if (/delete\s+from\s+(?:public\.)?genres/i.test(text)) { genres = []; return { rows: [], rowCount: 2 }; }
    if (/delete\s+from\s+(?:public\.)?animes/i.test(text)) {
      const deleted = exists;
      exists = false;
      return { rows: deleted ? [[id]] : [], rowCount: deleted ? 1 : 0 };
    }
    if (["GetAnimeById", "GetAnimeBySlug", "ListAnimes"].includes(name)) return { rows: exists ? [[...row.slice(0, 19), [...genres]]] : [] };
    if (name === "CountAnimes") return { rows: [[options.total ?? 1]] };
    if (name === "CreateAnime") return { rows: [[id]] };
    if (name === "CreateAnimeGenres" && typeof input !== "string") {
      genres = [...new Set([...genres, ...(input.values[1] as string[])])];
    }
    if (name === "UpdateAnimeById") return { rows: [row.slice(0, 19)] };
    if (name === "UpdateAnimeAvailableById") return { rows: exists ? [row.slice(0, 19)] : [] };
    return { rows: [], rowCount: 1 };
  };
  const client = { query, release: () => { released = true; } };
  return {
    db: { query, connect: async () => client } as unknown as Pool,
    calls,
    get released() { return released; },
  };
}

const byName = (calls: Call[], name: string) => calls.find((call) => call.name === name);

describe("anime service", () => {
  test("maps database rows, including numeric IDs and unknown enum values", () => {
    const anime = toAnimeModel({
      animeId: id, slug: "sample-anime", titleUa: "Назва", titleEn: "Title", titleOriginal: "Original",
      animeDescription: "Description", coverId: "4f2f627b-cec4-48ca-ae1e-1c59b1fccd7c", productionStudio: "Studio", malId: "123", anilistId: null,
      hikkaId: null, imdbId: null, yearReleased: null, avgEpisodeDuration: 0, episodesCount: 0,
      ageRestriction: "unknown", animeStatus: "unknown", animeFormat: "unknown", available: false,
      genres: ["action", "unknown", "drama"],
    });
    expect(anime.coverId).toBe("4f2f627b-cec4-48ca-ae1e-1c59b1fccd7c");
    expect(anime).toMatchObject({ malId: 123, anilistId: null, ageRestriction: null, animeStatus: null, animeFormat: "other", available: false, genres: ["action", "drama"] });
  });

  test("normalizes list filters and returns pagination and mapped items", async () => {
    const fake = fakeDb({ total: 21 });
    const result = await service.listAnimes(fake.db, { page: 2, limit: 10, genre: "action", status: "ongoing", format: "tv", year: 2020, available: false, sort: "title" });
    for (const call of fake.calls) {
      const placeholders = [...call.text.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]));
      expect([...new Set(placeholders)].sort((a, b) => a - b)).toEqual(call.values.map((_, i) => i + 1));
    }
    expect(result.pagination).toEqual({ page: 2, limit: 10, total: 21, total_pages: 3 });
    expect(result.items[0]).toMatchObject({ animeId: id, malId: 123, anilistId: 456, genres: ["action", "drama"] });
    expect(byName(fake.calls, "ListAnimes")?.values).toEqual(["action", "ongoing", "tv", 2020, false, "title", 10, 10]);
    expect(byName(fake.calls, "CountAnimes")?.values).toEqual(["action", "ongoing", "tv", 2020, false]);
  });

  test("uses list defaults and zero pages for an empty result", async () => {
    const fake = fakeDb({ missing: true, total: 0 });
    const result = await service.listAnimes(fake.db, {});
    expect(result).toEqual({ items: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } });
    expect(byName(fake.calls, "ListAnimes")?.values).toEqual([null, null, null, null, true, "newest", 0, 20]);
  });

  test("retrieves by id and slug and reports missing records", async () => {
    const fake = fakeDb();
    expect((await service.getAnime(fake.db, id)).slug).toBe("sample-anime");
    expect((await service.getAnimeBySlug(fake.db, "sample-anime")).animeId).toBe(id);
    expect(byName(fake.calls, "GetAnimeById")?.values).toEqual([id]);
    expect(byName(fake.calls, "GetAnimeBySlug")?.values).toEqual(["sample-anime"]);
    const missing = fakeDb({ missing: true });
    await expect(service.getAnime(missing.db, id)).rejects.toMatchObject({ collection: AnimeErrors, statusCode: 404 });
    await expect(service.getAnimeBySlug(missing.db, "missing")).rejects.toMatchObject({ collection: AnimeErrors, statusCode: 404 });
  });

  test("creates with defaults, deduplicates genres, and commits the transaction", async () => {
    const fake = fakeDb();
    const result = await service.createAnime(fake.db, { slug: "sample-anime", titleEn: "Title", genres: ["action", "drama", "action"], malId: 123, available: false });
    expect(result.animeId).toBe(id);
    expect(fake.calls.map((call) => call.name)).toEqual(["BEGIN", "CreateAnime", "CreateAnimeGenres", "GetAnimeById", "COMMIT"]);
    expect(byName(fake.calls, "CreateAnime")?.values).toEqual(["sample-anime", "", "Title", "", "", null, "", "123", null, null, null, null, 0, 0, null, null, "tv", false]);
    expect(byName(fake.calls, "CreateAnimeGenres")?.values).toEqual([id, ["action", "drama"]]);
    expect(fake.released).toBe(true);
  });

  test("rolls back and releases the client when inserting genres fails", async () => {
    const fake = fakeDb({ failAt: "CreateAnimeGenres", error: { code: "23503" } });
    await expect(service.createAnime(fake.db, { slug: "valid", titleEn: "Title", genres: ["action"] })).rejects.toThrow("related record does not exist");
    expect(fake.calls.map((call) => call.name)).toEqual(["BEGIN", "CreateAnime", "CreateAnimeGenres", "ROLLBACK"]);
    expect(fake.released).toBe(true);
  });

  test("translates database errors and preserves unexpected errors", async () => {
    for (const [code, detail, message] of [
      ["23505", "slug", "anime with this slug already exists"],
      ["23505", "mal_id", "anime with this MAL ID already exists"],
      ["23505", "anilist_id", "anime with this AniList ID already exists"],
      ["23505", "hikka_id", "anime with this Hikka ID already exists"],
      ["23505", "imdb_id", "anime with this IMDb ID already exists"],
      ["23505", "other", "anime with the same unique fields already exists"],
      ["22P02", "", "invalid data format or enum value"],
      ["22001", "", "field value exceeds maximum allowed length"],
      ["23514", "", "value violates a database constraint"],
      ["23503", "", "related record does not exist"],
      ["23502", "", "required field is missing"],
    ]) {
      const fake = fakeDb({ failAt: "GetAnimeById", error: { code, detail } });
      await expect(service.getAnime(fake.db, id)).rejects.toThrow(message);
    }
    const original = new Error("connection lost");
    const fake = fakeDb({ failAt: "GetAnimeById", error: original });
    await expect(service.getAnime(fake.db, id)).rejects.toBe(original);
    const duplicate = fakeDb({ failAt: "GetAnimeById", error: { code: "23505", constraint: "animes_slug_key" } });
    await expect(service.getAnime(duplicate.db, id)).rejects.toMatchObject({ collection: AnimeErrors, statusCode: 409 });
  });

  test("validates updates and merges unchanged fields", async () => {
    const fake = fakeDb();
    await service.updateAnime(fake.db, id, { titleEn: "New title", available: false, malId: null });
    expect(byName(fake.calls, "UpdateAnimeById")?.values).toEqual([
      "sample-anime", "Назва", "New title", "Original", "Description",
      ["mal_id"], null, "Studio", null, null, null, null, null,
      24, 12, null, null, "tv", false, id,
    ]);
    expect(fake.released).toBe(true);
    await expect(service.updateAnime(fakeDb({ missing: true }).db, id, { titleEn: "New" })).rejects.toMatchObject({ collection: AnimeErrors, statusCode: 404 });
  });

  test("a nullable update clears an existing external ID", async () => {
    const fake = fakeDb();
    await service.updateAnime(fake.db, id, { hikkaId: null });
    expect(byName(fake.calls, "UpdateAnimeById")?.values[9]).toBeNull();
  });

  test("replacing genres removes old genres, including when the new list is empty", async () => {
    const fake = fakeDb();
    const result = await service.updateAnime(fake.db, id, { genres: [] });
    expect(result.genres).toEqual([]);
  });

  test("replacing genres retains only the requested genres", async () => {
    const fake = fakeDb();
    const result = await service.updateAnime(fake.db, id, { genres: ["comedy"] });
    expect(result.genres).toEqual(["comedy"]);
  });

  test("soft deletes an existing anime by marking it unavailable", async () => {
    const fake = fakeDb();
    await expect(service.deleteAnime(fake.db, id)).resolves.toBeUndefined();
    expect(byName(fake.calls, "UpdateAnimeAvailableById")?.values).toEqual(expect.arrayContaining([false, id]));
    expect(byName(fake.calls, "DeleteAnime")).toBeUndefined();
    await expect(service.deleteAnime(fakeDb({ missing: true }).db, id)).rejects.toMatchObject({ collection: AnimeErrors, statusCode: 404 });
  });

  test("sends null_fields for every explicitly cleared nullable anime field", async () => {
    const fake = fakeDb();
    await service.updateAnime(fake.db, id, {
      malId: null,
      anilistId: null,
      hikkaId: null,
      imdbId: null,
      yearReleased: null,
      ageRestriction: null,
      animeStatus: null,
    });

    const values = byName(fake.calls, "UpdateAnimeById")!.values;
    expect(values[5]).toEqual([
      "mal_id", "anilist_id", "hikka_id", "imdb_id",
      "year_released", "age_restriction", "anime_status",
    ]);
    expect([6, 8, 9, 10, 11, 12, 15, 16].map((index) => values[index])).toEqual(
      Array(8).fill(null),
    );
  });

  test("keeps null_fields empty and sends null values to preserve untouched nullable anime fields", async () => {
    const fake = fakeDb();
    await service.updateAnime(fake.db, id, { titleEn: "New title" });

    const values = byName(fake.calls, "UpdateAnimeById")!.values;
    expect(values[5]).toEqual([]);
    expect([6, 8, 9, 10, 11, 12, 15, 16].map((index) => values[index])).toEqual(
      Array(8).fill(null),
    );
  });
});
